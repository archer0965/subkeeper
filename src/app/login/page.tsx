import { AuthForm } from "@/components/AuthForm";
import { sanitizeNextPath } from "@/lib/safe-next";

export const metadata = { title: "登入｜訂閱管家" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <AuthForm mode="login" nextPath={sanitizeNextPath(searchParams.next)} />;
}
