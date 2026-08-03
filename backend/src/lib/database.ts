/**
 * @file Prisma client instance initialized with a PostgreSQL adapter
 * @module DatabaseClient
 * @author  Ian MacDougall
 * @version 1.0
 */

import { PrismaClient } from "@prisma/client";
import {PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });
