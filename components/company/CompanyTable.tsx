"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import ActiveBadge from "./ActiveBadge";
import DeleteDialog from "./DeleteDialog";

type SortField = "code" | "name" | "legal_name" | "is_active" | "created_at";

interface Company {
  id: number;
  code: string;
  name: string;
  legal_name: string;
  alias: string | null;
  description: string | null;
  is_active: number;
  created_at: string;
}

interface CompanyListResponse {
  data: Company[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function CompanyTable() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusLoading, setStatusLoading] = useState<Set<number>>(new Set());

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        sortBy,
        sortOrder,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/companies?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data company");
      const json: CompanyListResponse = await res.json();
      setCompanies(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setPageSize(json.pageSize);
    } catch {
      setError("Gagal memuat data company");
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  }

  async function handleToggleStatus(company: Company) {
    setStatusLoading((prev) => new Set(prev).add(company.id));
    try {
      const res = await fetch(`/api/companies/${company.id}/status`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      await fetchCompanies();
    } catch {
      setError("Gagal mengubah status company");
    } finally {
      setStatusLoading((prev) => {
        const next = new Set(prev);
        next.delete(company.id);
        return next;
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/companies/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDeleteTarget(null);
      if (companies.length === 1 && page > 1) setPage((p) => p - 1);
      else await fetchCompanies();
    } catch {
      setError("Gagal menghapus company");
    } finally {
      setDeleteLoading(false);
    }
  }

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  }

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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari code, nama, atau legal name..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={fetchCompanies}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </form>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 p-2 rounded mt-2">{error}</p>
      )}

      {/* Table */}
      <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 select-none">
                  No
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("code")}
                >
                  Code <SortIcon field="code" />
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("name")}
                >
                  Name <SortIcon field="name" />
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("legal_name")}
                >
                  Legal Name <SortIcon field="legal_name" />
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("is_active")}
                >
                  Status <SortIcon field="is_active" />
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("created_at")}
                >
                  Created At <SortIcon field="created_at" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Memuat...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Tidak ada data company
                  </td>
                </tr>
              ) : (
                companies.map((company, index) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {startItem + index}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {company.code}
                    </td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate">
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {company.legal_name}
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge is_active={company.is_active} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(company.created_at).toLocaleDateString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/companies/${company.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Detail
                        </Link>
                        <Link
                          href={`/dashboard/companies/${company.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(company)}
                          disabled={statusLoading.has(company.id)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                        >
                          {statusLoading.has(company.id)
                            ? "..."
                            : company.is_active === 1
                            ? "Nonaktifkan"
                            : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(company)}
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
            {total === 0
              ? "Tidak ada data"
              : `${startItem}–${endItem} dari ${total} entri`}
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
        <DeleteDialog
          itemName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
