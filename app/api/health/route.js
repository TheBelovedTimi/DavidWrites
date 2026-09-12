import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function databaseConfigured() {
  return Boolean(
    process.env.GSS_DATABASE_URL ||
    process.env.GSS_DATABASE_DATABASE_URL ||
    process.env.GSS_DATABASE_POSTGRES_URL
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'Ghost Stories Society',
    databaseConfigured: databaseConfigured(),
    adminConfigured: Boolean(process.env.ADMIN_PASSWORD),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'
  });
}
