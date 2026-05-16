import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import CompanyForm from "@/components/company/CompanyForm";

interface EditCompanyPageProps {
  params: { id: string };
}

async function getCompany(id: string) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/companies/${id}`,
    {
      headers: { Cookie: `auth_token=${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const company = await getCompany(params.id);
  if (!company) notFound();

  const { code, name, legal_name, alias, description } = company;

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
      <h1 className="text-xl font-semibold text-gray-800">Edit Company</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CompanyForm
          mode="edit"
          companyId={company.id}
          initialData={{
            code,
            name,
            legal_name,
            alias: alias ?? "",
            description: description ?? "",
          }}
        />
      </div>
    </div>
  );
}
