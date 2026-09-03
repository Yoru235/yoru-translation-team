import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  try {
    const { mangaId } = await params;

    const ratings = await prisma.rating.findMany({
      where: {
        mangaId,
      },
      select: {
        value: true,
      },
    });

    const total = ratings.length;

    const average =
      total === 0
        ? 0
        : ratings.reduce((sum, rating) => sum + rating.value, 0) /
          total;

    return NextResponse.json({
      success: true,
      average,
      total,
    });
  } catch (error) {
    console.error("Lỗi lấy rating:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy đánh giá",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  try {
    const { mangaId } = await params;
    const body = await request.json();

    const value = Number(body.value);

    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Đánh giá phải từ 1 đến 5 sao",
        },
        { status: 400 }
      );
    }

    const manga = await prisma.manga.findUnique({
      where: {
        id: mangaId,
      },
    });

    if (!manga) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy truyện",
        },
        { status: 404 }
      );
    }

    await prisma.rating.create({
      data: {
        mangaId,
        value,
      },
    });

    const ratings = await prisma.rating.findMany({
      where: {
        mangaId,
      },
      select: {
        value: true,
      },
    });

    const average =
      ratings.length === 0
        ? 0
        : ratings.reduce((sum, rating) => sum + rating.value, 0) /
          ratings.length;

    await prisma.manga.update({
      where: {
        id: mangaId,
      },
      data: {
        rating: average,
      },
    });

    return NextResponse.json({
      success: true,
      average,
      total: ratings.length,
    });
  } catch (error) {
    console.error("Lỗi đánh giá:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể gửi đánh giá",
      },
      { status: 500 }
    );
  }
}