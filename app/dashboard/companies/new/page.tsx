import Link from "next/link";
import CompanyForm from "@/components/company/CompanyForm";

export default function NewCompanyPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/companies"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke Companies
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-gray-800">Tambah Company</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CompanyForm mode="create" />
      </div>
    </div>
  );
}
