import { Reports } from "@/features/content/reports";
import type { components } from "@/lib/api/schema";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; key?: string }>;
}) {
  const params = await searchParams;
  const kind = ["song", "pattern", "chord", "instrument", "tuning"].includes(
    params.kind || "",
  )
    ? (params.kind as components["schemas"]["ReportInput"]["kind"])
    : "song";
  return (
    <>
      <h1>Report a content problem</h1>
      <Reports initialKind={kind} initialKey={params.key || ""} />
    </>
  );
}
