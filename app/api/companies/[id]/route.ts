import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

const updateCompanySchema = z.object({
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

// GET /api/companies/[id]
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

    const company = await prisma.mstCompany.findFirst({
      where: { id, deleted_at: null },
    });

    if (!company) {
      return NextResponse.json({ error: "Company tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(company, { status: 200 });
  } catch (error) {
    console.error("GET /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// PUT /api/companies/[id]
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

    const existing = await prisma.mstCompany.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Company tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateCompanySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { code, name, legal_name, alias, description } = parsed.data;

    const updated = await prisma.mstCompany.update({
      where: { id },
      data: {
        code,
        name,
        legal_name,
        alias: alias ?? null,
        description: description ?? null,
        updated_by: userId,
      },
    });

    return NextResponse.json(
      { message: "Company berhasil diperbarui", company: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/companies/[id]
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

    const existing = await prisma.mstCompany.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Company tidak ditemukan" }, { status: 404 });
    }

    await prisma.mstCompany.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    });

    return NextResponse.json({ message: "Company berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
