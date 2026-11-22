import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 5,

    // Necessário para caching_sha2_password no MySQL 8 local sem TLS
    allowPublicKeyRetrieval: true,

    // Opcional: fuso da sessão. O Prisma grava DateTime em UTC; num servidor
    // com outro fuso (ex.: bdr_api em -03:00) use MYSQL_SESSION_TIME_ZONE=+00:00
    // para que NOW() das procedures/functions fique no mesmo referencial.
    ...(process.env.MYSQL_SESSION_TIME_ZONE && {
      initSql: `SET time_zone = '${process.env.MYSQL_SESSION_TIME_ZONE.replace(/'/g, "")}'`,
    }),
  });

  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}