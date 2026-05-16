import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import UserForm from "@/components/user/UserForm";

interface EditUserPageProps {
  params: { id: string };
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

async function getUser(id: string): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/users/${id}`,
    {
      headers: { Cookie: `auth_token=${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const user = await getUser(params.id);
  if (!user) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/users"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke Users
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-gray-800">Edit User</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <UserForm
          mode="edit"
          initialData={{
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          }}
        />
      </div>
    </div>
  );
}