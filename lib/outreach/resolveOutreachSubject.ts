import { DEFAULT_OUTREACH_SUBJECT } from '@/lib/constants/gmail';

export function resolveOutreachSubject(body: string, senderName?: string | null) {
  const lines = body.split(/\r?\n/);
  const firstLine = lines[0]?.trim() ?? '';

  if (/^subject:/i.test(firstLine)) {
    const subject = firstLine.replace(/^subject:\s*/i, '').trim();
    const remainingBody = lines.slice(1).join('\n').replace(/^\s+/, '');
    return {
      subject: subject || DEFAULT_OUTREACH_SUBJECT,
      body: remainingBody || body,
    };
  }

  if (senderName?.trim()) {
    return {
      subject: `Introduction from ${senderName.trim()}`,
      body,
    };
  }

  return {
    subject: DEFAULT_OUTREACH_SUBJECT,
    body,
  };
}
