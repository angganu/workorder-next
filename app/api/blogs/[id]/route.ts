import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

const updateBlogSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  kategori: z.enum(["sport", "art", "news", "education"], {
    errorMap: () => ({ message: "Kategori tidak valid" }),
  }),
  gambar: z.string().nullable().optional(),
});

async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? payload.userId : null;
}

// GET /api/blogs/[id]
export async function GET(
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

    const blog = await prisma.blog.findUnique({ where: { id, deletedAt: null } });
    if (!blog) {
      return NextResponse.json({ error: "Blog tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(blog, { status: 200 });
  } catch (error) {
    console.error("GET /api/blogs/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// PUT /api/blogs/[id]
export async function PUT(
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

    const body = await request.json();
    const parsed = updateBlogSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { judul, deskripsi, kategori, gambar } = parsed.data;

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        judul,
        deskripsi,
        kategori,
        gambar: gambar !== undefined ? gambar : existing.gambar,
        updatedBy: userId,
      },
    });

    return NextResponse.json({ message: "Blog berhasil diperbarui", blog: updated }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/blogs/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/blogs/[id]
export async function DELETE(
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

    await prisma.blog.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return NextResponse.json({ message: "Blog berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/blogs/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
