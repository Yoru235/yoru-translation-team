import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "yoru_session";

const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 ngày

type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "READER";
  avatar: string | null;
};

export async function createSession(userId: string) {
  const cookieStore = await cookies();

  // Tạo token ngẫu nhiên
  const token = randomBytes(32).toString("hex");

  // Thời gian hết hạn: 7 ngày
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION * 1000
  );

  // Lưu session vào database
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  // Chỉ lưu token vào cookie
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      token: sessionCookie.value,
    },
    include: {
      user: true,
    },
  });

  // Không có session
  if (!session) {
    return null;
  }

  // Session hết hạn
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    cookieStore.delete(SESSION_COOKIE);

    return null;
  }

  // Tài khoản bị khóa
  if (!session.user.isActive) {
    cookieStore.delete(SESSION_COOKIE);

    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    role: session.user.role,
    avatar: session.user.avatar ?? null,
  };
}

export async function clearSession() {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (sessionCookie?.value) {
    await prisma.session.deleteMany({
      where: {
        token: sessionCookie.value,
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}