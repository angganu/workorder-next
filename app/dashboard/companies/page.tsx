import Link from "next/link";
import CompanyTable from "@/components/company/CompanyTable";

export default function CompaniesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Companies</h1>
        <Link
          href="/dashboard/companies/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          + Tambah Company
        </Link>
      </div>
      <CompanyTable />
    </div>
  );
}
