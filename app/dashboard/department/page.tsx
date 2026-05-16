import Link from "next/link";
import DepartmentTable from "@/components/department/DepartmentTable";

export default function DepartmentPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Department</h1>
        <Link
          href="/dashboard/department/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          + Tambah Department
        </Link>
      </div>
      <DepartmentTable />
    </div>
  );
}
