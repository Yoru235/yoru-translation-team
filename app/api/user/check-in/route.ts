import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Chưa đăng nhập.",
        },
        { status: 401 }
      );
    }

    const userId = currentUser.id;

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

    // Lấy ngày hiện tại theo giờ Việt Nam (Asia/Ho_Chi_Minh)
    const vnDateStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    const startOfDay = new Date(`${vnDateStr}T00:00:00+07:00`);
    const endOfDay = new Date(`${vnDateStr}T23:59:59.999+07:00`);

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