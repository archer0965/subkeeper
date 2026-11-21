import { redirect } from "next/navigation";
import { hubAuthRedirect } from "@/lib/hub-auth";
import { sanitizeNextPath } from "@/lib/safe-next";

export const metadata = { title: "登入｜訂閱管家" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  redirect(hubAuthRedirect("login", sanitizeNextPath(searchParams.next || "/app")));
}
