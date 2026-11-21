import { AuthForm } from "@/components/AuthForm";
import { sanitizeNextPath } from "@/lib/safe-next";

export const metadata = { title: "註冊｜訂閱管家" };

export default function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <AuthForm mode="signup" nextPath={sanitizeNextPath(searchParams.next)} />
  );
}
