"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CompanyFormData {
  code: string;
  name: string;
  legal_name: string;
  alias: string;
  description: string;
}

interface CompanyFormProps {
  mode: "create" | "edit";
  companyId?: number;
  initialData?: CompanyFormData;
}

export default function CompanyForm({ mode, companyId, initialData }: CompanyFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<CompanyFormData>(
    initialData ?? { code: "", name: "", legal_name: "", alias: "", description: "" }
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

    // Client-side empty-field validation
    const errors: Record<string, string> = {};
    if (!form.code.trim()) errors.code = "Code wajib diisi";
    if (!form.name.trim()) errors.name = "Nama wajib diisi";
    if (!form.legal_name.trim()) errors.legal_name = "Legal name wajib diisi";
    if (Object.keys(errors).length > 0) {
      setFieldError(errors);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        legal_name: form.legal_name.trim(),
        alias: form.alias.trim(),
        description: form.description.trim(),
      };

      const url = mode === "create" ? "/api/companies" : `/api/companies/${companyId}`;
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
        mode === "create" ? "/dashboard/companies" : `/dashboard/companies/${companyId}`
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

      {/* Legal Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Legal Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="legal_name"
          value={form.legal_name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.legal_name && (
          <p className="text-xs text-red-500 mt-1">{fieldError.legal_name}</p>
        )}
      </div>

      {/* Alias */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alias
        </label>
        <input
          type="text"
          name="alias"
          value={form.alias}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.alias && (
          <p className="text-xs text-red-500 mt-1">{fieldError.alias}</p>
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
            ? "Tambah Company"
            : "Simpan Perubahan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/companies")}
          className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
