import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? payload.userId : null;
}

// PATCH /api/companies/[id]/status — toggle is_active between 1 and 0
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

    const existing = await prisma.mstCompany.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Company tidak ditemukan" }, { status: 404 });
    }

    const newStatus = existing.is_active === 1 ? 0 : 1;

    const updated = await prisma.mstCompany.update({
      where: { id },
      data: { is_active: newStatus, updated_by: userId },
    });

    return NextResponse.json(
      { message: `Company berhasil di${newStatus === 1 ? "aktifkan" : "nonaktifkan"}`, company: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/companies/[id]/status error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
