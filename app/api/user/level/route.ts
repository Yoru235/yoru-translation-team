import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/*
  GET /api/user/level

  Trả về:
  - level hiện tại
  - points hiện tại
  - điểm cần để lên level tiếp theo
  - tiến độ level
*/

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn chưa đăng nhập.",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        level: true,
        points: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy tài khoản.",
        },
        { status: 404 }
      );
    }

    const level = user.level;
    const points = user.points;

    /*
      Mỗi level cần thêm 100 điểm.
      Ví dụ:
      Level 1 → 100 điểm
      Level 2 → 200 điểm
      Level 3 → 300 điểm
    */

    const currentLevelRequiredPoints = level * 100;
    const nextLevelRequiredPoints = (level + 1) * 100;

    const pointsIntoLevel =
      points - currentLevelRequiredPoints;

    const pointsNeededForNextLevel =
      nextLevelRequiredPoints - points;

    const progress =
      points >= nextLevelRequiredPoints
        ? 100
        : Math.max(
            0,
            Math.min(
              100,
              (pointsIntoLevel / 100) * 100
            )
          );

    return NextResponse.json({
      success: true,

      user: {
        id: user.id,
        username: user.username,
      },

      level: {
        current: level,
        points,
        nextLevel: level + 1,
        nextLevelPoints: nextLevelRequiredPoints,
        pointsNeeded: Math.max(
          0,
          pointsNeededForNextLevel
        ),
        progress,
      },
    });
  } catch (error) {
    console.error("GET USER LEVEL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải thông tin level.",
      },
      { status: 500 }
    );
  }
}