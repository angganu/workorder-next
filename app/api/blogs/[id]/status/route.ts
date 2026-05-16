import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? payload.userId : null;
}

// PATCH /api/blogs/[id]/status — toggle published/unpublished
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const existing = await prisma.blog.findUnique({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ error: "Blog tidak ditemukan" }, { status: 404 });
    }

    const newStatus = existing.status === "published" ? "unpublished" : "published";

    const updated = await prisma.blog.update({
      where: { id },
      data: { status: newStatus, updatedBy: userId },
    });

    return NextResponse.json(
      { message: `Blog berhasil di-${newStatus === "published" ? "publish" : "unpublish"}`, blog: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/blogs/[id]/status error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
