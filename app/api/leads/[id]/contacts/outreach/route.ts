import { jsonResponse, errorResponse } from '@/lib/api/response';
import { withAuth } from '@/lib/api/middleware/authMiddleware.js';
import { withApproved } from '@/lib/api/middleware/requireApprovalMiddleware.js';
import { resolveRequestedConfigVersion } from '@/server/providers/shared/dashboardVersionHelpers.js';
import leadRepository from '@/server/repositories/leadRepository.js';

type DbUser = {
  business_id?: number | string | null;
  config_version?: number | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const PATCH = withAuth(
  withApproved(async (request: Request, context: RouteContext, user: DbUser) => {
    try {
      const { id } = await context.params;
      const business_id = user.business_id;

      if (!business_id) {
        return errorResponse('Business affiliation required', 400);
      }

      if (!id) {
        return errorResponse('Lead id is required', 400);
      }

      const { searchParams } = new URL(request.url);
      const resolved = resolveRequestedConfigVersion(
        user,
        searchParams.get('version')
      );

      if (!resolved.ok) {
        if (resolved.reason === 'no_config') {
          return errorResponse('Lead not found', 404);
        }
        return errorResponse('Invalid version', 400);
      }

      const version = resolved.version;

      const body = (await request.json()) as {
        email?: string;
        outreach_email?: string;
        status?: string;
      };

      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!email) {
        return errorResponse('email is required', 400);
      }

      const hasOutreachEmail = typeof body.outreach_email === 'string';
      const hasStatus = typeof body.status === 'string';

      if (!hasOutreachEmail && !hasStatus) {
        return errorResponse('outreach_email or status is required', 400);
      }

      const result = await leadRepository.updateOutreachEmail({
        id,
        business_id,
        version,
        email,
        outreach_email: hasOutreachEmail ? body.outreach_email : undefined,
        status: hasStatus ? body.status : undefined,
      });

      if (!result.affectedRows) {
        return errorResponse('Outreach email not found', 404);
      }

      return jsonResponse({
        success: true,
        outreach_email: result.outreach_email,
        status: result.status,
      });
    } catch (error) {
      console.error('[PATCH /api/leads/[id]/contacts/outreach]', error);
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, error instanceof Error ? 400 : 500);
    }
  })
);
