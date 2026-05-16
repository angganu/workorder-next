import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import AccountClient from "./AccountClient";

async function getCurrentUser(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true },
  });
}

export default async function AccountPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) redirect("/login");

  const user = await getCurrentUser(payload.userId);
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Pengaturan Akun</h1>
      <AccountClient user={user} />
    </div>
  );
}
