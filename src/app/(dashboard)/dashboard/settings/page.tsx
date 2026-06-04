import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AccountSettings } from "@/components/account-settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Account settings, data export, and privacy.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  return (
    <AccountSettings
      email={session.user.email}
      hasPassword={Boolean(user?.passwordHash)}
    />
  );
}
