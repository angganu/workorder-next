import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import ActiveBadge from "@/components/company/ActiveBadge";

interface CompanyDetailPageProps {
  params: { id: string };
}

interface Company {
  id: number;
  code: string;
  name: string;
  legal_name: string;
  alias: string | null;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

async function getCompany(id: string): Promise<Company | null> {
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

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const company = await getCompany(params.id);
  if (!company) notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/companies"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke Companies
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-800">{company.name}</h1>
          <ActiveBadge is_active={company.is_active} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Code
            </p>
            <p className="text-gray-800">{company.code}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Legal Name
            </p>
            <p className="text-gray-800">{company.legal_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Alias
            </p>
            <p className="text-gray-800">{company.alias ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Tanggal Dibuat
            </p>
            <p className="text-gray-800">
              {new Date(company.created_at).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {company.description && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Description
            </p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {company.description}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Link
            href={`/dashboard/companies/${company.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Edit Company
          </Link>
          <Link
            href="/dashboard/companies"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
          >
            Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
