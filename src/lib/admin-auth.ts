import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnvOrDefault } from "@/lib/env";

const ADMIN_COOKIE_NAME = "diemdanh_admin";
const DEFAULT_ADMIN_PASSCODE = "0944550550";

export async function requireAdminAuth() {
  const cookieStore = await cookies();
  const passcode = getEnvOrDefault("ADMIN_PASSCODE", DEFAULT_ADMIN_PASSCODE);

  if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== passcode) {
    redirect("/admin/login");
  }
}

export async function setAdminAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, getEnvOrDefault("ADMIN_PASSCODE", DEFAULT_ADMIN_PASSCODE), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
