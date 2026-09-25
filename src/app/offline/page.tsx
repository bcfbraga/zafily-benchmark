export const metadata = { title: "Você está offline — Zafily" };

// Inline styles only, deliberately: this page is the service worker's offline
// fallback, so it must render correctly even if the browser can't fetch the
// app's CSS/JS bundles (no network at all).
export default function OfflinePage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 24,
      textAlign: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      background: "#F6F6FB",
      color: "#16162B",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 9999,
        background: "#EFEBFF", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24,
      }}>
        📡
      </div>
      <div>
        <p style={{ fontWeight: 600, fontSize: 18, margin: 0 }}>Você está offline</p>
        <p style={{ color: "#675F73", fontSize: 14, marginTop: 6, maxWidth: 320 }}>
          Não foi possível conectar com o Zafily. Verifique sua internet e tente novamente.
        </p>
      </div>
    </div>
  );
}
