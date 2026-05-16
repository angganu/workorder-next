import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;

const createCompanySchema = z.object({
  code:        z.string().min(1, "Code wajib diisi"),
  name:        z.string().min(1, "Nama wajib diisi"),
  legal_name:  z.string().min(1, "Legal name wajib diisi"),
  alias:       z.string().optional(),
  description: z.string().optional(),
});

async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? payload.userId : null;
}

// GET /api/companies — list with search, sort, pagination
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";
    const sortBy = searchParams.get("sortBy") ?? "created_at";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const allowedSortFields = ["code", "name", "legal_name", "is_active", "created_at"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const safeSortOrder: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";

    const where: Prisma.MstCompanyWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { legal_name: { contains: search } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.mstCompany.count({ where }),
      prisma.mstCompany.findMany({
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
    console.error("GET /api/companies error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// POST /api/companies — create new company
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { code, name, legal_name, alias, description } = parsed.data;

    // Check for existing non-deleted record with the same code
    const existing = await prisma.mstCompany.findFirst({
      where: { code, deleted_at: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Code sudah digunakan", field: "code" },
        { status: 400 }
      );
    }

    const company = await prisma.mstCompany.create({
      data: {
        code,
        name,
        legal_name,
        alias: alias ?? null,
        description: description ?? null,
        created_by: userId,
        updated_by: userId,
      },
    });

    return NextResponse.json({ message: "Company berhasil dibuat", company }, { status: 201 });
  } catch (error) {
    console.error("POST /api/companies error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
