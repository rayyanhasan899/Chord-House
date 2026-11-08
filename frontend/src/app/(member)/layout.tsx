import { Protected } from "@/features/auth/context";
export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Protected>{children}</Protected>;
}
