import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const sql = await readFile(path.join(process.cwd(), "prisma", "schema.sql"), "utf8");
  const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await db.$executeRawUnsafe(statement);
  console.log(`Database schema ready (${statements.length} statements).`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
