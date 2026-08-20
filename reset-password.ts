
import { prisma } from "./lib/prisma";

import bcrypt from "bcryptjs";



async function main() {

  const email = "dung191206@gmail.com"; 

  const newPassword = "YoruAdmin@2026";



  const passwordHash = await bcrypt.hash(newPassword, 12);



  const user = await prisma.user.update({

    where: { email },

    data: {

      passwordHash,

      role: "OWNER",

      isActive: true,

    },

  });



  console.log("Đã reset mật khẩu cho:", user.email);

  console.log("Mật khẩu mới:", newPassword);

}



main()

  .catch(console.error)

  .finally(async () => {

    await prisma.$disconnect();

  });

