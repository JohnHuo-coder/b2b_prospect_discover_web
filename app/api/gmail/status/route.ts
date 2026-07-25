import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { withAuth } from '@/lib/api/middleware/authMiddleware.js';
import gmailRepository from '@/server/repositories/gmailRepository.js';

export const GET = withAuth(async (_request, _context, user) => {
  try {
    await gmailRepository.ensureTable();
    const status = await gmailRepository.getStatus(user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[GET /api/gmail/status]', error);
    return errorResponse('Internal server error', 500);
  }
});
