import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

const updateDepartmentSchema = z.object({
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

// GET /api/department/[id]
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

    const department = await prisma.mstDepartment.findFirst({
      where: { id, deleted_at: null },
      include: { company: true },
    });

    if (!department) {
      return NextResponse.json({ error: "Department tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(department, { status: 200 });
  } catch (error) {
    console.error("GET /api/department/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// PUT /api/department/[id]
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

    const existing = await prisma.mstDepartment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Department tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateDepartmentSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { company_id, code, name, description, department_level, department_parent_id } =
      parsed.data;

    const updated = await prisma.mstDepartment.update({
      where: { id },
      data: {
        company_id,
        code,
        name,
        description: description ?? null,
        department_level: department_level ?? null,
        department_parent_id: department_parent_id ?? null,
        updated_by: userId,
      },
    });

    return NextResponse.json(
      { message: "Department berhasil diperbarui", department: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/department/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/department/[id]
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

    const existing = await prisma.mstDepartment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Department tidak ditemukan" }, { status: 404 });
    }

    await prisma.mstDepartment.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    });

    return NextResponse.json({ message: "Department berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/department/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
