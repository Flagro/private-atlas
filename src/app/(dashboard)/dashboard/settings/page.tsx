import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Account settings, data export, and privacy.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  return <AccountSettings email={session.user.email} />;
}
