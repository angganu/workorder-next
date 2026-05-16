"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrors({ general: "Token tidak ditemukan. Silakan minta link reset baru." });
    }
  }, [token]);

  function validate() {
    const newErrors: typeof errors = {};
    if (!password) {
      newErrors.password = "Password baru wajib diisi";
    } else if (password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
    }
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error || "Reset password gagal" });
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setErrors({ general: "Terjadi kesalahan, coba lagi" });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Password Berhasil Direset</h1>
          <p className="text-gray-600 mb-6">
            Password Anda telah diperbarui. Anda akan diarahkan ke halaman login...
          </p>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">
            Login Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Reset Password</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Masukkan password baru Anda.</p>
        {errors.general && !token ? (
          <div className="text-center">
            <p className="text-red-500 text-sm mb-4">{errors.general}</p>
            <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
              Minta link reset baru
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Konfirmasi Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
            {errors.general && (
              <div className="mb-4">
                <p className="text-red-500 text-sm text-center">{errors.general}</p>
                <p className="text-center mt-2">
                  <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
                    Minta link reset baru
                  </Link>
                </p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Memproses..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Memuat...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
