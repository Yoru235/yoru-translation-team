import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}