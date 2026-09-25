const AWIN_BASE = "https://api.awin.com";
const CEA_ADVERTISER_ID = 17648;

export type AwinValidationResult =
  | { ok: true; status: "connected"; publisherId: string }
  | { ok: true; status: "pending_program_approval"; publisherId: string }
  | { ok: false; status: "invalid_credentials"; message: string }
  | { ok: false; status: "api_error"; message: string };

interface AwinAccount {
  accountId: number;
  accountType: string;
}

// The user only provides an API key — the publisher account tied to that
// key is looked up from Awin directly rather than asked for by hand.
async function discoverPublisherId(
  apiToken: string
): Promise<{ ok: true; publisherId: string } | { ok: false; message: string }> {
  let res: Response;

  try {
    res = await fetch(`${AWIN_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, message: `Could not reach Awin API: ${msg}` };
  }

  if (res.status === 401 || res.status === 403) {
    return { ok: false, message: "API Key is invalid. Check your Awin account settings." };
  }

  if (!res.ok) {
    return { ok: false, message: `Awin returned an unexpected error (HTTP ${res.status}). Try again later.` };
  }

  const accounts = (await res.json()) as AwinAccount[];
  const publisher = accounts.find(a => a.accountType === "publisher") ?? accounts[0];
  if (!publisher) {
    return { ok: false, message: "No Awin publisher account was found for this API Key." };
  }

  return { ok: true, publisherId: String(publisher.accountId) };
}

export async function validateAwinConnection(apiToken: string): Promise<AwinValidationResult> {
  const discovered = await discoverPublisherId(apiToken);
  if (!discovered.ok) {
    return { ok: false, status: "invalid_credentials", message: discovered.message };
  }
  const { publisherId } = discovered;

  let res: Response;

  try {
    res = await fetch(
      `${AWIN_BASE}/publishers/${publisherId}/programmedetails?advertiserId=${CEA_ADVERTISER_ID}&relationship=joined`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
        // Short timeout — don't keep the user waiting
        signal: AbortSignal.timeout(8000),
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, status: "api_error", message: `Could not reach Awin API: ${msg}` };
  }

  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      status: "invalid_credentials",
      message: "API Key is invalid. Check your Awin account settings.",
    };
  }

  if (!res.ok) {
    // 404 on this endpoint typically means the publisher hasn't joined the programme
    if (res.status === 404) {
      return { ok: true, status: "pending_program_approval", publisherId };
    }
    return {
      ok: false,
      status: "api_error",
      message: `Awin returned an unexpected error (HTTP ${res.status}). Try again later.`,
    };
  }

  // 200 with body — publisher is joined and approved
  return { ok: true, status: "connected", publisherId };
}

export async function testAwinConnection(
  publisherId: string,
  apiToken: string
): Promise<AwinValidationResult> {
  let res: Response;

  try {
    res = await fetch(
      `${AWIN_BASE}/publishers/${publisherId}/programmedetails?advertiserId=${CEA_ADVERTISER_ID}&relationship=joined`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
        signal: AbortSignal.timeout(8000),
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, status: "api_error", message: `Could not reach Awin API: ${msg}` };
  }

  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      status: "invalid_credentials",
      message: "API Key is invalid. Check your Awin account settings.",
    };
  }

  if (!res.ok) {
    if (res.status === 404) {
      return { ok: true, status: "pending_program_approval", publisherId };
    }
    return {
      ok: false,
      status: "api_error",
      message: `Awin returned an unexpected error (HTTP ${res.status}). Try again later.`,
    };
  }

  return { ok: true, status: "connected", publisherId };
}
