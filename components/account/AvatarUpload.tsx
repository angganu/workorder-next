"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface AvatarUploadProps {
  currentAvatar: string | null;
  userName: string;
  onSuccess: (newAvatar: string) => void;
}

export default function AvatarUpload({ currentAvatar, userName, onSuccess }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengunggah avatar");
        setPreview(currentAvatar);
      } else {
        onSuccess(data.avatar);
      }
    } catch {
      setError("Terjadi kesalahan saat mengunggah");
      setPreview(currentAvatar);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        {preview ? (
          <Image
            src={preview}
            alt={userName}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        {loading ? "Mengunggah..." : "Ganti Foto"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
