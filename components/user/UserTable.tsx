"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data user");
      const json: UserListResponse = await res.json();
      setUsers(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setPageSize(json.pageSize);
    } catch {
      setError("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleteTarget(null);
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
      else await fetchUsers();
    } catch {
      setError("Gagal menghapus user");
    } finally {
      setDeleteLoading(false);
    }
  }

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="mt-4">
      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </form>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded mt-4">{error}</p>}

      {/* Table */}
      <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 select-none">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tanggal Dibuat</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Memuat...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Tidak ada data user
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{startItem + index}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Detail
                        </Link>
                        <Link
                          href={`/dashboard/users/${user.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {total === 0 ? "Tidak ada data" : `${startItem}–${endItem} dari ${total} entri`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1 || loading}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              ‹
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages || loading}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteUserDialog
          userName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

interface DeleteUserDialogProps {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function DeleteUserDialog({ userName, onConfirm, onCancel, loading = false }: DeleteUserDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Hapus User</h2>
        <p className="text-sm text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus{" "}
          <span className="font-medium text-gray-800">&ldquo;{userName}&rdquo;</span>? Tindakan
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