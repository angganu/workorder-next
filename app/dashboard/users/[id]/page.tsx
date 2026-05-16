import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";

interface UserDetailPageProps {
  params: { id: string };
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
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

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const user = await getUser(params.id);
  if (!user) notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/users"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke Users
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h1 className="text-xl font-semibold text-gray-800">{user.name}</h1>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Email
            </p>
            <p className="text-gray-800">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Tanggal Dibuat
            </p>
            <p className="text-gray-800">
              {new Date(user.createdAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Link
            href={`/dashboard/users/${user.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Edit User
          </Link>
          <Link
            href="/dashboard/users"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
          >
            Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}