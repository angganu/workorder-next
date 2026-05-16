"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  avatar: string | null;
}

interface EditUserData {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

interface UserFormProps {
  initialData?: EditUserData;
  mode: "create" | "edit";
}

export default function UserForm({ initialData, mode }: UserFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<UserFormData>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    password: "",
    avatar: initialData?.avatar ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldError((prev) => ({ ...prev, [name]: "" }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldError({});

    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Nama wajib diisi";
    if (!form.email.trim()) errors.email = "Email wajib diisi";
    if (mode === "create" && !form.password) errors.password = "Password wajib diisi";
    if (Object.keys(errors).length > 0) {
      setFieldError(errors);
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
      };
      if (form.password) payload.password = form.password;

      const url = mode === "create" ? "/api/users" : `/api/users/${initialData?.id}`;
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

      setSuccess(mode === "create" ? "User berhasil dibuat" : "User berhasil diperbarui");
      setTimeout(() => {
        router.refresh();
        router.push(mode === "create" ? "/dashboard/users" : `/dashboard/users/${initialData?.id}`);
      }, 1000);
    } catch {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded">{success}</p>}

      {/* Nama */}
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
        {fieldError.name && <p className="text-xs text-red-500 mt-1">{fieldError.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.email && <p className="text-xs text-red-500 mt-1">{fieldError.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password {mode === "create" && <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          name="password"
          value={form.password ?? ""}
          onChange={handleChange}
          placeholder={mode === "edit" ? "Kosongkan jika tidak ingin mengubah" : ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.password && <p className="text-xs text-red-500 mt-1">{fieldError.password}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && (
            <svg className="animate-spin w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Menyimpan..." : mode === "create" ? "Tambah User" : "Simpan Perubahan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/users")}
          className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}