import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import StatusBadge from "@/components/blog/StatusBadge";

interface BlogDetailPageProps {
  params: { id: string };
}

interface Blog {
  id: number;
  judul: string;
  deskripsi: string;
  gambar: string | null;
  kategori: string;
  status: "published" | "unpublished";
  created_at: string;
  updated_at: string;
}

async function getBlog(id: string): Promise<Blog | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/blogs/${id}`,
    {
      headers: { Cookie: `auth_token=${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const blog = await getBlog(params.id);
  if (!blog) notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/blogs"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke Blogs
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-800">{blog.judul}</h1>
          <StatusBadge status={blog.status} />
        </div>

        {blog.gambar && (
          <div className="relative w-full h-56 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={blog.gambar}
              alt={blog.judul}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Kategori
            </p>
            <p className="text-gray-800 capitalize">{blog.kategori}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Tanggal Dibuat
            </p>
            <p className="text-gray-800">
              {new Date(blog.created_at).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Deskripsi
          </p>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {blog.deskripsi}
          </p>
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Link
            href={`/dashboard/blogs/${blog.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Edit Blog
          </Link>
          <Link
            href="/dashboard/blogs"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
          >
            Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
