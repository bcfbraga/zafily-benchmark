import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default async function LegacyProposalRedirect({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const { print } = await searchParams;
  redirect(`/${username}/proposta/${slug}${print ? `?print=${print}` : ""}`);
}
