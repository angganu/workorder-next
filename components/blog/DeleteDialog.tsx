"use client";

interface DeleteDialogProps {
  blogTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteDialog({
  blogTitle,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Hapus Blog</h2>
        <p className="text-sm text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus{" "}
          <span className="font-medium text-gray-800">&ldquo;{blogTitle}&rdquo;</span>? Tindakan
          ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
