import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? payload.userId : null;
}

// GET /api/companies/options — return active, non-deleted companies as { value, label } for react-select
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";

    const companies = await prisma.mstCompany.findMany({
      where: {
        deleted_at: null,
        is_active: 1,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { code: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    const options = companies.map((c) => ({ value: c.id, label: c.name }));

    return NextResponse.json(options, { status: 200 });
  } catch (error) {
    console.error("GET /api/companies/options error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
