"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import StatusBadge from "./StatusBadge";
import DeleteDialog from "./DeleteDialog";

type BlogStatus = "published" | "unpublished";
type BlogKategori = "sport" | "art" | "news" | "education";
type SortField = "judul" | "kategori" | "status" | "created_at";

interface Blog {
  id: number;
  judul: string;
  deskripsi: string;
  gambar: string | null;
  kategori: BlogKategori;
  status: BlogStatus;
  created_at: string;
}

interface BlogListResponse {
  data: Blog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function BlogTable() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

   const [search, setSearch] = useState("");
   const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
     new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
     new Date(),
   ]);
   const [sortBy, setSortBy] = useState<SortField>("created_at");
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusLoading, setStatusLoading] = useState<number | null>(null);

   const fetchBlogs = useCallback(async () => {
     setLoading(true);
     setError("");
     try {
       const params = new URLSearchParams({
         page: String(page),
         sortBy,
         sortOrder,
       });
       if (search) params.set("search", search);
       if (dateRange[0])
         params.set("dateFrom", dateRange[0].toISOString().split("T")[0]);
       if (dateRange[1])
         params.set("dateTo", dateRange[1].toISOString().split("T")[0]);

       const res = await fetch(`/api/blogs?${params.toString()}`);
       if (!res.ok) throw new Error("Gagal memuat data blog");
       const json: BlogListResponse = await res.json();
       setBlogs(json.data);
       setTotal(json.total);
       setTotalPages(json.totalPages);
       setPageSize(json.pageSize);
     } catch {
       setError("Gagal memuat data blog");
     } finally {
       setLoading(false);
     }
   }, [page, sortBy, sortOrder, search, dateRange]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

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
    fetchBlogs();
  }

  async function handleToggleStatus(blog: Blog) {
    setStatusLoading(blog.id);
    try {
      const res = await fetch(`/api/blogs/${blog.id}/status`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      await fetchBlogs();
    } catch {
      setError("Gagal mengubah status blog");
    } finally {
      setStatusLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/blogs/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleteTarget(null);
      if (blogs.length === 1 && page > 1) setPage((p) => p - 1);
      else await fetchBlogs();
    } catch {
      setError("Gagal menghapus blog");
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul atau deskripsi..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1">Rentang Tanggal</label>
            <DatePicker
              selected={dateRange[0]}
              onChange={(dates: [Date | null, Date | null]) => {
                setDateRange(dates);
                setPage(1);
              }}
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              selectsRange={true}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Pilih rentang tanggal"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            {/* <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Cari
            </button> */}
            {/* <button
              type="button"
              onClick={() => { setSearch(""); setDateRange([null, null]); setPage(1); }}
              className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-md hover:bg-gray-50"
            >
              Reset
            </button> */}
            <button
              type="button"
              onClick={fetchBlogs}
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

      {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}

      {/* Table */}
      <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 select-none">#</th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("judul")}
                >
                  Judul <SortIcon field="judul" />
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("kategori")}
                >
                  Kategori <SortIcon field="kategori" />
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon field="status" />
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("created_at")}
                >
                  Tanggal Dibuat <SortIcon field="created_at" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Memuat...
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Tidak ada data blog
                  </td>
                </tr>
              ) : (
                blogs.map((blog, index) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{startItem + index}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                      {blog.judul}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{blog.kategori}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={blog.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(blog.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/blogs/${blog.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Detail
                        </Link>
                        <Link
                          href={`/dashboard/blogs/${blog.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(blog)}
                          disabled={statusLoading === blog.id}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                        >
                          {statusLoading === blog.id
                            ? "..."
                            : blog.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(blog)}
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
          blogTitle={deleteTarget.judul}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
