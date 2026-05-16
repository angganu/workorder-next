"use client";

import { useState } from "react";
import AvatarUpload from "@/components/account/AvatarUpload";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

interface AccountClientProps {
  user: User;
}

export default function AccountClient({ user }: AccountClientProps) {
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldError((prev) => ({ ...prev, [e.target.name]: "" }));
    setError("");
    setSuccess("");
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldError({});

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldError({ [data.field]: data.error });
        } else {
          setError(data.error ?? "Gagal memperbarui profil");
        }
      } else {
        setSuccess("Profil berhasil diperbarui");
      }
    } catch {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Avatar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center gap-4">
        <AvatarUpload
          currentAvatar={avatar}
          userName={profile.name}
          onSuccess={(newAvatar) => setAvatar(newAvatar)}
        />
        <p className="text-sm text-gray-500 text-center">
          Format: JPG, PNG, GIF, WebP
        </p>
      </div>

      {/* Profile form + Change password */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Informasi Profil</h2>

            {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fieldError.name && (
                <p className="text-xs text-red-500 mt-1">{fieldError.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fieldError.email && (
                <p className="text-xs text-red-500 mt-1">{fieldError.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
