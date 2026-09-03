import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // TODO: lấy user đang đăng nhập
    // Tạm thời lấy userId từ header để test API
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Chưa đăng nhập.",
        },
        { status: 401 }
      );
    }

    // Kiểm tra user
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        level: true,
        points: true,
        isActive: true,
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

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản đã bị khóa.",
        },
        { status: 403 }
      );
    }

    // Lấy ngày hiện tại
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Kiểm tra hôm nay đã điểm danh chưa
    const existingCheckIn =
      await prisma.userCheckIn.findFirst({
        where: {
          userId,
          checkedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

    if (existingCheckIn) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn đã điểm danh hôm nay rồi.",
        },
        { status: 400 }
      );
    }

    // Mỗi lần điểm danh +10 điểm
    const CHECK_IN_POINTS = 10;

    const result = await prisma.$transaction(
      async (tx) => {
        const checkIn =
          await tx.userCheckIn.create({
            data: {
              userId,
            },
          });

        const updatedUser =
          await tx.user.update({
            where: {
              id: userId,
            },
            data: {
              points: {
                increment: CHECK_IN_POINTS,
              },
            },
            select: {
              id: true,
              username: true,
              level: true,
              points: true,
            },
          });

        return {
          checkIn,
          user: updatedUser,
        };
      }
    );

    return NextResponse.json({
      success: true,
      message: `Điểm danh thành công! +${CHECK_IN_POINTS} điểm.`,
      user: result.user,
    });
  } catch (error) {
    console.error("CHECK IN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Điểm danh thất bại.",
      },
      { status: 500 }
    );
  }
}