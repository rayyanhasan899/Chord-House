import { SongDetail } from "@/features/songs/song-detail";
export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SongDetail key={id} id={id} />;
}
