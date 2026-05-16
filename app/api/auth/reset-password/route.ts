import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Token tidak valid atau sudah digunakan" },
        { status: 400 }
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordReset.delete({ where: { token } });
      return NextResponse.json(
        { error: "Token sudah kadaluarsa, silakan minta link reset baru" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.delete({ where: { token } });

    return NextResponse.json({ message: "Password berhasil direset" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
