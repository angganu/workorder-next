import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    redirect("/login");
  }

  return (
    <DashboardShell name={payload.name} email={payload.email} avatar={null}>
      {children}
    </DashboardShell>
  );
}
