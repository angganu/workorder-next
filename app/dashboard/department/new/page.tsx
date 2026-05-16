import Link from "next/link";
import DepartmentForm from "@/components/department/DepartmentForm";

export default function NewDepartmentPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/department"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke Department
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-gray-800">Tambah Department</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <DepartmentForm mode="create" />
      </div>
    </div>
  );
}
