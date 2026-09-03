import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    const group = await prisma.translationGroup.findUnique({
      where: {
        slug,
      },
      include: {
        mangas: {
          orderBy: [
            {
              views: "desc",
            },
            {
              updatedAt: "desc",
            },
          ],
          select: {
            id: true,
            title: true,
            coverUrl: true,
            type: true,
            status: true,
            views: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            mangas: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy nhóm dịch",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Lỗi lấy nhóm dịch:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy thông tin nhóm dịch",
      },
      {
        status: 500,
      }
    );
  }
}