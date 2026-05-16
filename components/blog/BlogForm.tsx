"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type BlogKategori = "sport" | "art" | "news" | "education";

interface BlogFormData {
  judul: string;
  deskripsi: string;
  kategori: BlogKategori | "";
  gambar: string | null;
}

interface BlogFormProps {
  initialData?: BlogFormData;
  blogId?: number;
  mode: "create" | "edit";
}

const KATEGORI_OPTIONS: { value: BlogKategori; label: string }[] = [
  { value: "sport", label: "Sport" },
  { value: "art", label: "Art" },
  { value: "news", label: "News" },
  { value: "education", label: "Education" },
];

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function BlogForm({ initialData, blogId, mode }: BlogFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BlogFormData>(
    initialData ?? { judul: "", deskripsi: "", kategori: "", gambar: null }
  );
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.gambar ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldError((prev) => ({ ...prev, [name]: "" }));
    setError("");
    setSuccess("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      setFieldError((prev) => ({
        ...prev,
        gambar: "Format file tidak valid. Gunakan JPG, PNG, GIF, atau WebP.",
      }));
      return;
    }

    setFieldError((prev) => ({ ...prev, gambar: "" }));
    setPendingFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("avatar", file);
    // Reuse the profile avatar endpoint for image upload
    const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.avatar as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldError({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!form.judul.trim()) errors.judul = "Judul wajib diisi";
    if (!form.deskripsi.trim()) errors.deskripsi = "Deskripsi wajib diisi";
    if (!form.kategori) errors.kategori = "Kategori wajib dipilih";
    if (Object.keys(errors).length > 0) {
      setFieldError(errors);
      setLoading(false);
      return;
    }

    try {
      let gambarPath = form.gambar;

      // Upload new image if selected
      if (pendingFile) {
        const uploaded = await uploadImage(pendingFile);
        if (!uploaded) {
          setFieldError({ gambar: "Gagal mengunggah gambar" });
          setLoading(false);
          return;
        }
        gambarPath = uploaded;
      }

      const payload = {
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        kategori: form.kategori,
        gambar: gambarPath,
      };

      const url = mode === "create" ? "/api/blogs" : `/api/blogs/${blogId}`;
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

      setSuccess(mode === "create" ? "Blog berhasil dibuat" : "Blog berhasil diperbarui");
      setTimeout(() => {
        router.refresh();
        router.push(mode === "create" ? "/dashboard/blogs" : `/dashboard/blogs/${blogId}`);
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

      {/* Judul */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Judul <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="judul"
          value={form.judul}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldError.judul && (
          <p className="text-xs text-red-500 mt-1">{fieldError.judul}</p>
        )}
      </div>

      {/* Deskripsi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deskripsi <span className="text-red-500">*</span>
        </label>
        <textarea
          name="deskripsi"
          value={form.deskripsi}
          onChange={handleChange}
          rows={5}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        {fieldError.deskripsi && (
          <p className="text-xs text-red-500 mt-1">{fieldError.deskripsi}</p>
        )}
      </div>

      {/* Kategori */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori <span className="text-red-500">*</span>
        </label>
        <select
          name="kategori"
          value={form.kategori}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">-- Pilih Kategori --</option>
          {KATEGORI_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {fieldError.kategori && (
          <p className="text-xs text-red-500 mt-1">{fieldError.kategori}</p>
        )}
      </div>

      {/* Gambar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
        {imagePreview && (
          <div className="relative w-40 h-28 mb-2 rounded overflow-hidden border border-gray-200">
            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {imagePreview ? "Ganti Gambar" : "Pilih Gambar"}
        </button>
        <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, GIF, WebP</p>
        {fieldError.gambar && (
          <p className="text-xs text-red-500 mt-1">{fieldError.gambar}</p>
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
            <svg className="animate-spin w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Menyimpan..." : mode === "create" ? "Tambah Blog" : "Simpan Perubahan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/blogs")}
          className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
