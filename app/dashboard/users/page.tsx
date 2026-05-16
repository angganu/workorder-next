import Link from "next/link";
import UserTable from "@/components/user/UserTable";

export default function UsersPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Users</h1>
        <Link
          href="/dashboard/users/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          + Tambah User
        </Link>
      </div>
      <UserTable />
    </div>
  );
}