import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

const PAGE_SIZE = 10;

const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? payload.userId : null;
}

// GET /api/users — list with search, pagination
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          created_at: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const formattedData = data.map((u) => ({
      ...u,
      created_at: u.created_at.toISOString(),
    }));

    return NextResponse.json(
      { data: formattedData, total, page, pageSize: PAGE_SIZE, totalPages },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// POST /api/users — create new user
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah digunakan", field: "email" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
      select: { id: true, name: true, email: true, created_at: true },
    });

    return NextResponse.json({ message: "User berhasil dibuat", user }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}