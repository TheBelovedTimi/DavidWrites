import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'Ghost Stories Society',
    databaseConfigured: Boolean(process.env.GSS_DATABASE_URL),
    adminConfigured: Boolean(process.env.ADMIN_PASSWORD),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'
  });
}
