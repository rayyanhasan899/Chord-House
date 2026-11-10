import { Practice } from "@/features/practice/practice";
export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; song?: string }>;
}) {
  const params = await searchParams;
  return (
    <Practice
      initialFocus={
        typeof params.focus === "string" ? params.focus.slice(0, 200) : ""
      }
      initialSong={
        typeof params.song === "string" && /^[0-9a-f-]{36}$/i.test(params.song)
          ? params.song
          : null
      }
    />
  );
}
