import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _dbAvailable: boolean | null = null

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Check if database is available.
 * Returns false if connection fails (e.g., in Vercel serverless without SQLite).
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  if (_dbAvailable !== null) return _dbAvailable
  try {
    await db.$queryRaw`SELECT 1`
    _dbAvailable = true
  } catch {
    _dbAvailable = false
  }
  return _dbAvailable
}
