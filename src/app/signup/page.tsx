import { redirect } from "next/navigation";
import { hubAuthRedirect } from "@/lib/hub-auth";
import { sanitizeNextPath } from "@/lib/safe-next";

export const metadata = { title: "註冊｜訂閱管家" };

export default function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  redirect(hubAuthRedirect("signup", sanitizeNextPath(searchParams.next || "/app")));
}
