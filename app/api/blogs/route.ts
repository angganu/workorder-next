import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;

const createBlogSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  kategori: z.enum(["sport", "art", "news", "education"], {
    errorMap: () => ({ message: "Kategori tidak valid" }),
  }),
  gambar: z.string().optional(),
});

async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? payload.userId : null;
}

// GET /api/blogs — list with filter, sort, pagination
export async function GET(request: NextRequest) {
  try {    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") ?? "created_at";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const allowedSortFields = ["judul", "kategori", "status", "created_at"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const safeSortOrder: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";

    const where: Prisma.BlogWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { judul: { contains: search } },
        { deskripsi: { contains: search } },
      ];
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        (where.created_at as Prisma.DateTimeFilter).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        (where.created_at as Prisma.DateTimeFilter).lte = toDate;
      }
    }

    const [total, data] = await Promise.all([
      prisma.blog.count({ where }),
      prisma.blog.findMany({
        where,
        orderBy: { [safeSortBy]: safeSortOrder },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return NextResponse.json(
      { data, total, page, pageSize: PAGE_SIZE, totalPages },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/blogs error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// POST /api/blogs — create new blog
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createBlogSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { judul, deskripsi, kategori, gambar } = parsed.data;

    const blog = await prisma.blog.create({
      data: {
        judul,
        deskripsi,
        kategori,
        gambar: gambar ?? null,
        status: "unpublished",
        created_by: userId,
        updated_by: userId,
      },
    });

    return NextResponse.json({ message: "Blog berhasil dibuat", blog }, { status: 201 });
  } catch (error) {
    console.error("POST /api/blogs error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
