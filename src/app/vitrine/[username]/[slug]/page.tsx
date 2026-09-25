import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

export default async function LegacyVitrineRedirect({ params }: Props) {
  const { username, slug } = await params;
  redirect(`/${username}/${slug}`);
}
