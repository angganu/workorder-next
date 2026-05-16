import Link from "next/link";
import UserForm from "@/components/user/UserForm";

export default function NewUserPage() {
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
      <h1 className="text-xl font-semibold text-gray-800">Tambah User</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <UserForm mode="create" />
      </div>
    </div>
  );
}