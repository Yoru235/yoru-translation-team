import { prisma } from "./prisma";

async function main() {
  const mangas = await prisma.manga.findMany();

  console.log("✅ Kết nối database thành công!");
  console.log("📚 Số truyện hiện có:", mangas.length);
}

main()
  .catch((error) => {
    console.error("❌ Lỗi kết nối database:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });