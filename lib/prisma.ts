import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { env } from "cloudflare:workers";

// Biến lưu trữ Singleton Instance trong V8 Isolate
let clientInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  // Nếu đã có instance trong V8 isolate này, dùng lại instance cũ
  if (clientInstance) {
    return clientInstance;
  }

  if (!env.yoru_database) {
    throw new Error(
      "D1 Database binding 'yoru_database' không tồn tại trong môi trường Cloudflare Workers."
    );
  }

  // Khởi tạo adapter mới từ binding hiện tại
  const adapter = new PrismaD1(env.yoru_database);
  clientInstance = new PrismaClient({ adapter });

  return clientInstance;
}

// Proxy đóng vai trò làm wrapper giữ nguyên cú pháp gọi prisma.model.method
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrisma();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// import { PrismaClient } from "../app/generated/prisma/client";
// import { PrismaD1 } from "@prisma/adapter-d1";
// import { env } from "cloudflare:workers";

// const adapter = new PrismaD1(
//   env.yoru_database
// );

// export const prisma = new PrismaClient({
//   adapter,
// });