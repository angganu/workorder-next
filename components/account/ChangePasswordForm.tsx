"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldError((prev) => ({ ...prev, [e.target.name]: "" }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldError({});

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldError({ [data.field]: data.error });
        } else {
          setError(data.error ?? "Gagal memperbarui password");
        }
      } else {
        setSuccess("Password berhasil diperbarui");
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Ubah Password</h2>

      {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password Saat Ini
        </label>
        <input
          type="password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.currentPassword && (
          <p className="text-xs text-red-500 mt-1">{fieldError.currentPassword}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password Baru
        </label>
        <input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          required
          minLength={8}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.newPassword && (
          <p className="text-xs text-red-500 mt-1">{fieldError.newPassword}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Konfirmasi Password Baru
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{fieldError.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Ubah Password"}
      </button>
    </form>
  );
}
