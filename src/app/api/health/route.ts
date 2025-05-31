import { NextResponse } from 'next/server';

// Health check endpoint for Docker and monitoring
export async function GET() {
  try {
    // Basic health check - return OK
    // In production, you might want to check database connectivity
    return NextResponse.json(
      { 
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'hep-companion-app'
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'hep-companion-app',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
} 