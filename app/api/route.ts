import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const groups = await prisma.translationGroup.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            mangas: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Lỗi lấy nhóm dịch:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy danh sách nhóm dịch",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const avatar = body.avatar
      ? String(body.avatar).trim()
      : null;
    const description = body.description
      ? String(body.description).trim()
      : null;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Tên nhóm dịch không được để trống",
        },
        {
          status: 400,
        }
      );
    }

    const baseSlug = createSlug(name);

    let slug = baseSlug;
    let number = 2;

    while (
      await prisma.translationGroup.findUnique({
        where: {
          slug,
        },
      })
    ) {
      slug = `${baseSlug}-${number}`;
      number++;
    }

    const group = await prisma.translationGroup.create({
      data: {
        name,
        slug,
        avatar,
        description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        group,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Lỗi tạo nhóm dịch:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tạo nhóm dịch",
      },
      {
        status: 500,
      }
    );
  }
}
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    const avatar = body.avatar
      ? String(body.avatar).trim()
      : null;
    const description = body.description
      ? String(body.description).trim()
      : null;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID nhóm dịch",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Tên nhóm dịch không được để trống",
        },
        {
          status: 400,
        }
      );
    }

    const existingGroup =
      await prisma.translationGroup.findUnique({
        where: {
          id,
        },
      });

    if (!existingGroup) {
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

    let slug = existingGroup.slug;

    // Nếu đổi tên thì tạo lại slug
    if (name !== existingGroup.name) {
      const baseSlug = createSlug(name);

      slug = baseSlug;
      let number = 2;

      while (true) {
        const found =
          await prisma.translationGroup.findUnique({
            where: {
              slug,
            },
          });

        if (!found || found.id === id) {
          break;
        }

        slug = `${baseSlug}-${number}`;
        number++;
      }
    }

    const group =
      await prisma.translationGroup.update({
        where: {
          id,
        },
        data: {
          name,
          slug,
          avatar,
          description,
        },
        include: {
          _count: {
            select: {
              mangas: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Lỗi sửa nhóm dịch:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể sửa nhóm dịch",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID nhóm dịch",
        },
        {
          status: 400,
        }
      );
    }

    const existingGroup =
      await prisma.translationGroup.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              mangas: true,
            },
          },
        },
      });

    if (!existingGroup) {
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

    // Không cho xóa nhóm vẫn còn truyện
    if (existingGroup._count.mangas > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không thể xóa nhóm dịch đang có truyện. Hãy chuyển hoặc xóa các truyện thuộc nhóm trước.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.translationGroup.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa nhóm dịch",
    });
  } catch (error) {
    console.error("Lỗi xóa nhóm dịch:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể xóa nhóm dịch",
      },
      {
        status: 500,
      }
    );
  }
}