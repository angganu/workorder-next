import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;

const createDepartmentSchema = z.object({
  company_id:           z.number().int().positive("Company wajib dipilih"),
  code:                 z.string().min(1, "Code wajib diisi"),
  name:                 z.string().min(1, "Nama wajib diisi"),
  description:          z.string().optional(),
  department_level:     z.number().int().optional(),
  department_parent_id: z.number().int().optional(),
});

async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? payload.userId : null;
}

// GET /api/department — list with filter, sort, pagination
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

    const allowedSortFields = ["code", "name", "department_level", "is_active", "created_at"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const safeSortOrder: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";

    const where: Prisma.MstDepartmentWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.mstDepartment.count({ where }),
      prisma.mstDepartment.findMany({
        where,
        include: { company: true },
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
    console.error("GET /api/department error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// POST /api/department — create new department
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createDepartmentSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { company_id, code, name, description, department_level, department_parent_id } =
      parsed.data;

    // Check for duplicate code among non-deleted records
    const existing = await prisma.mstDepartment.findFirst({
      where: { code, deleted_at: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Code sudah digunakan", field: "code" },
        { status: 400 }
      );
    }

    const department = await prisma.mstDepartment.create({
      data: {
        company_id,
        code,
        name,
        description: description ?? null,
        department_level: department_level ?? null,
        department_parent_id: department_parent_id ?? null,
        created_by: userId,
        updated_by: userId,
      },
    });

    return NextResponse.json(
      { message: "Department berhasil dibuat", department },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/department error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
