import { jsonResponse, errorResponse } from '@/lib/api/response';
import { withAuth } from '@/lib/api/middleware/authMiddleware.js';
import { withApproved } from '@/lib/api/middleware/requireApprovalMiddleware.js';
import { resolveRequestedConfigVersion } from '@/server/providers/shared/dashboardVersionHelpers.js';
import leadRepository from '@/server/repositories/leadRepository.js';
import gmailRepository from '@/server/repositories/gmailRepository.js';
import { resolveOutreachSubject } from '@/lib/outreach/resolveOutreachSubject';

type DbUser = {
  id?: number | string | null;
  business_id?: number | string | null;
  config_version?: number | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withAuth(
  withApproved(async (request: Request, context: RouteContext, user: DbUser) => {
    try {
      const { id } = await context.params;
      const business_id = user.business_id;

      if (!user.id) {
        return errorResponse('User not found', 401);
      }

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
      };

      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!email) {
        return errorResponse('email is required', 400);
      }

      const sendContext = await leadRepository.getOutreachSendContext({
        id,
        business_id,
        version,
        email,
        outreach_email: body.outreach_email,
      });

      if (!sendContext) {
        return errorResponse('Outreach email not found', 404);
      }

      const gmailStatus = await gmailRepository.getStatus(user.id);
      if (!gmailStatus.connected) {
        return errorResponse('Gmail is not connected', 403);
      }

      const { subject, body: emailBody } = resolveOutreachSubject(
        sendContext.body,
        sendContext.subject_line
      );

      await gmailRepository.sendOutreachEmail({
        userId: user.id,
        to: sendContext.to,
        subject,
        body: emailBody,
        senderName: sendContext.sender_name,
      });

      const result = await leadRepository.finalizeOutreachSend({
        id,
        business_id,
        version,
        email,
        outreach_email: sendContext.body,
      });

      if (!result.affectedRows) {
        return errorResponse('Failed to update outreach email status', 500);
      }

      return jsonResponse({
        success: true,
        outreach_email: result.outreach_email,
        status: result.status,
      });
    } catch (error) {
      console.error('[POST /api/leads/[id]/contacts/send]', error);
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      const status =
        message === 'Gmail is not connected'
          ? 403
          : error instanceof Error
            ? 400
            : 500;
      return errorResponse(message, status);
    }
  })
);
