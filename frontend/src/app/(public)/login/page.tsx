import { AuthForm } from "@/features/auth/forms";
import { Feedback } from "@/components/ui/feedback";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      {params.deleted === "1" && (
        <Feedback message="Your account and private records have been deleted. All sessions have been revoked." />
      )}
      <AuthForm />
    </>
  );
}
