import Link from "next/link";
import BlogTable from "@/components/blog/BlogTable";

export default function BlogsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Blogs</h1>
        <Link
          href="/dashboard/blogs/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          + Tambah Blog
        </Link>
      </div>
      <BlogTable />
    </div>
  );
}
