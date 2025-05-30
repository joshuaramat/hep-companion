import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'hep-companion',
      version: process.env.npm_package_version || '1.0.0'
    },
    { status: 200 }
  );
} 