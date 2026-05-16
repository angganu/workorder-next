import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import DepartmentForm from "@/components/department/DepartmentForm";

interface EditDepartmentPageProps {
  params: { id: string };
}

async function getDepartment(id: string) {
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

export default async function EditDepartmentPage({ params }: EditDepartmentPageProps) {
  const department = await getDepartment(params.id);
  if (!department) notFound();

  const { code, name, description, department_level, department_parent_id, company } = department;

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
      <h1 className="text-xl font-semibold text-gray-800">Edit Department</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <DepartmentForm
          mode="edit"
          departmentId={department.id}
          initialData={{
            company_id: company.id,
            company_option: { value: company.id, label: company.name },
            code,
            name,
            description: description ?? "",
            department_level: String(department_level ?? ""),
            department_parent_id: String(department_parent_id ?? ""),
          }}
        />
      </div>
    </div>
  );
}
