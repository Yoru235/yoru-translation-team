import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        manga: {
          select: {
            id: true,
            title: true,
          },
        },
        chapter: {
          select: {
            id: true,
            chapter: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("ADMIN COMMENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải danh sách bình luận.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID bình luận.",
        },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: {
        id,
      },
    });

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy bình luận.",
        },
        { status: 404 }
      );
    }

    await prisma.comment.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa bình luận.",
    });
  } catch (error) {
    console.error(
      "DELETE ADMIN COMMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Không thể xóa bình luận.",
      },
      { status: 500 }
    );
  }
}