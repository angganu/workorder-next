import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import ActiveBadge from "@/components/company/ActiveBadge";

interface DepartmentDetailPageProps {
  params: { id: string };
}

interface Company {
  id: number;
  name: string;
}

interface Department {
  id: number;
  code: string;
  name: string;
  description: string | null;
  department_level: number | null;
  department_parent_id: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  company: Company;
}

async function getDepartment(id: string): Promise<Department | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/department/${id}`,
    {
      headers: { Cookie: `auth_token=${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function DepartmentDetailPage({ params }: DepartmentDetailPageProps) {
  const department = await getDepartment(params.id);
  if (!department) notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/department"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke Department
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-800">{department.name}</h1>
          <ActiveBadge is_active={department.is_active} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Code
            </p>
            <p className="text-gray-800">{department.code}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Company
            </p>
            <p className="text-gray-800">{department.company.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Department Level
            </p>
            <p className="text-gray-800">
              {department.department_level !== null ? department.department_level : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Parent Department ID
            </p>
            <p className="text-gray-800">
              {department.department_parent_id !== null ? department.department_parent_id : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Tanggal Dibuat
            </p>
            <p className="text-gray-800">
              {new Date(department.created_at).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {department.description && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Description
            </p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {department.description}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Link
            href={`/dashboard/department/${department.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Edit Department
          </Link>
          <Link
            href="/dashboard/department"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
          >
            Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
