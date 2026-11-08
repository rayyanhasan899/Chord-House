import { CodeForm, EmailRequest } from "@/features/auth/forms";
export default function Page() {
  return (
    <>
      <CodeForm purpose="verify" />
      <EmailRequest purpose="verify" />
    </>
  );
}
