import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { env } from "cloudflare:workers";

const adapter = new PrismaD1(
  env.yoru_database
);

export const prisma = new PrismaClient({
  adapter,
});