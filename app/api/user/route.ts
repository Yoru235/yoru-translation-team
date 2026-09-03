import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getLevelFromPoints(points: number) {
  if (points >= 1000) return 5;
  if (points >= 500) return 4;
  if (points >= 250) return 3;
  if (points >= 100) return 2;
  return 1;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu userId.",
        },
        { status: 400 }
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingCheckIn = await prisma.userCheckIn.findFirst({
      where: {
        userId,
        checkedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json({
        success: false,
        error: "Hôm nay bạn đã điểm danh rồi.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const checkIn = await tx.userCheckIn.create({
        data: {
          userId,
        },
      });

      const user = await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          points: {
            increment: 10,
          },
        },
      });

      const newLevel = getLevelFromPoints(user.points);

      const updatedUser =
        newLevel !== user.level
          ? await tx.user.update({
              where: {
                id: userId,
              },
              data: {
                level: newLevel,
              },
            })
          : user;

      return {
        checkIn,
        user: updatedUser,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Điểm danh thành công.",
      points: result.user.points,
      level: result.user.level,
    });
  } catch (error) {
    console.error("CHECK-IN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể điểm danh.",
      },
      { status: 500 }
    );
  }
}