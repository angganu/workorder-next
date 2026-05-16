"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AsyncSelect from "react-select/async";

type CompanyOption = { value: number; label: string };

interface DepartmentFormData {
  company_id: number | null;
  company_option: CompanyOption | null;
  code: string;
  name: string;
  description: string;
  department_level: string;
  department_parent_id: string;
}

interface DepartmentFormProps {
  mode: "create" | "edit";
  departmentId?: number;
  initialData?: DepartmentFormData;
}

async function loadCompanyOptions(inputValue: string): Promise<CompanyOption[]> {
  const params = new URLSearchParams();
  if (inputValue) params.set("search", inputValue);
  const res = await fetch(`/api/companies/options?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export default function DepartmentForm({
  mode,
  departmentId,
  initialData,
}: DepartmentFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<Omit<DepartmentFormData, "company_id" | "company_option">>(
    {
      code: initialData?.code ?? "",
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      department_level: initialData?.department_level ?? "",
      department_parent_id: initialData?.department_parent_id ?? "",
    }
  );

  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(
    initialData?.company_option ?? null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldError((prev) => ({ ...prev, [name]: "" }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldError({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!form.code.trim()) errors.code = "Code wajib diisi";
    if (!form.name.trim()) errors.name = "Nama wajib diisi";
    if (!selectedCompany) errors.company_id = "Perusahaan wajib dipilih";
    if (Object.keys(errors).length > 0) {
      setFieldError(errors);
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        company_id: selectedCompany!.value,
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (form.department_level.trim() !== "") {
        payload.department_level = parseInt(form.department_level, 10);
      }
      if (form.department_parent_id.trim() !== "") {
        payload.department_parent_id = parseInt(form.department_parent_id, 10);
      }

      const url =
        mode === "create" ? "/api/department" : `/api/department/${departmentId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldError({ [data.field]: data.error });
        } else {
          setError(data.error ?? "Terjadi kesalahan");
        }
        return;
      }

      router.push(
        mode === "create"
          ? "/dashboard/department"
          : `/dashboard/department/${departmentId}`
      );
    } catch {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</p>
      )}

      {/* Company (AsyncSelect) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Perusahaan <span className="text-red-500">*</span>
        </label>
        <AsyncSelect
          loadOptions={loadCompanyOptions}
          defaultOptions
          value={selectedCompany}
          onChange={(opt) => {
            setSelectedCompany(opt as CompanyOption | null);
            setFieldError((prev) => ({ ...prev, company_id: "" }));
            setError("");
          }}
          placeholder="Cari perusahaan..."
          noOptionsMessage={() => "Tidak ada perusahaan ditemukan"}
          loadingMessage={() => "Memuat..."}
          classNamePrefix="react-select"
          isClearable
        />
        {fieldError.company_id && (
          <p className="text-xs text-red-500 mt-1">{fieldError.company_id}</p>
        )}
      </div>

      {/* Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="code"
          value={form.code}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.code && (
          <p className="text-xs text-red-500 mt-1">{fieldError.code}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nama <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.name && (
          <p className="text-xs text-red-500 mt-1">{fieldError.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deskripsi
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        {fieldError.description && (
          <p className="text-xs text-red-500 mt-1">{fieldError.description}</p>
        )}
      </div>

      {/* Department Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Level Department
        </label>
        <input
          type="number"
          name="department_level"
          value={form.department_level}
          onChange={handleChange}
          min={0}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.department_level && (
          <p className="text-xs text-red-500 mt-1">{fieldError.department_level}</p>
        )}
      </div>

      {/* Department Parent ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parent Department ID
        </label>
        <input
          type="number"
          name="department_parent_id"
          value={form.department_parent_id}
          onChange={handleChange}
          min={0}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.department_parent_id && (
          <p className="text-xs text-red-500 mt-1">{fieldError.department_parent_id}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && (
            <svg
              className="animate-spin w-4 h-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {loading
            ? "Menyimpan..."
            : mode === "create"
            ? "Tambah Department"
            : "Simpan Perubahan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/department")}
          className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
