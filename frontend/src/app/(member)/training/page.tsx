import { Training } from "@/features/training/training";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ song?: string }>;
}) {
  const params = await searchParams;
  return (
    <Training
      initialSong={
        typeof params.song === "string" && /^[0-9a-f-]{36}$/i.test(params.song)
          ? params.song
          : ""
      }
    />
  );
}
