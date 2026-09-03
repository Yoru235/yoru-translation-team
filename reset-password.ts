import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "dung191206@gmail.com";
  const newPassword = "YoruAdmin@2026";

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const user = await prisma.user.upsert({
    where: {
      email,
    },

    update: {
      passwordHash,
      role: "OWNER",
      isActive: true,
    },

    create: {
      email,
      passwordHash,
      username: "YoruAdmin",
      role: "OWNER",
      isActive: true,
    },
  });

  console.log("=================================");
  console.log("Đã tạo/cập nhật tài khoản admin");
  console.log("Email:", user.email);
  console.log("Username:", user.username);
  console.log("Mật khẩu:", newPassword);
  console.log("Role:", user.role);
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("RESET PASSWORD ERROR:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });