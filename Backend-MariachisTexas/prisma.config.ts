import path from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import type { PrismaConfig } from 'prisma'

export default {
  schema: path.join('prisma', 'schema.prisma'),
} satisfies PrismaConfig