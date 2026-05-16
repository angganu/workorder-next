import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [published, unpublished] = await Promise.all([
      prisma.blog.count({ where: { status: "published" } }),
      prisma.blog.count({ where: { status: "unpublished" } }),
    ]);

    const total = published + unpublished;

    return NextResponse.json({ total, published, unpublished }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
