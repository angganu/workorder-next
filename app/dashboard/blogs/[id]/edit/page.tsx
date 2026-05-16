import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import BlogForm from "@/components/blog/BlogForm";

interface EditBlogPageProps {
  params: { id: string };
}

async function getBlog(id: string) {
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

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const blog = await getBlog(params.id);
  if (!blog) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/blogs"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali ke Blogs
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-gray-800">Edit Blog</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <BlogForm
          mode="edit"
          blogId={blog.id}
          initialData={{
            judul: blog.judul,
            deskripsi: blog.deskripsi,
            kategori: blog.kategori,
            gambar: blog.gambar,
          }}
        />
      </div>
    </div>
  );
}
