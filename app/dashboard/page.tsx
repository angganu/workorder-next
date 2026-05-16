import { prisma } from "@/lib/prisma";
import StatsCard from "@/components/StatsCard";

async function getStats() {
  const [published, unpublished] = await Promise.all([
    prisma.blog.count({ where: { status: "published" } }),
    prisma.blog.count({ where: { status: "unpublished" } }),
  ]);
  return { total: published + unpublished, published, unpublished };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Blog" value={stats.total} />
        <StatsCard title="Published" value={stats.published} />
        <StatsCard title="Unpublished" value={stats.unpublished} />
      </div>
    </div>
  );
}
