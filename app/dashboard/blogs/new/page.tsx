import Link from "next/link";
import BlogForm from "@/components/blog/BlogForm";

export default function NewBlogPage() {
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
      <h1 className="text-xl font-semibold text-gray-800">Tambah Blog Baru</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <BlogForm mode="create" />
      </div>
    </div>
  );
}
