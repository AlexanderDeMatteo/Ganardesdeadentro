import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';

  if (!token) {
    return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/coach/:path*', '/api/nutrition/titan'],
};
