import { DEFAULT_OUTREACH_SUBJECT } from '@/lib/constants/gmail';

export function resolveOutreachSubject(
  body: string,
  subjectLine?: string | null
) {
  const lines = body.split(/\r?\n/);
  const firstLine = lines[0]?.trim() ?? '';
  const configuredSubject = subjectLine?.trim() || DEFAULT_OUTREACH_SUBJECT;

  if (/^subject:/i.test(firstLine)) {
    const remainingBody = lines.slice(1).join('\n').replace(/^\s+/, '');
    return {
      subject: configuredSubject,
      body: remainingBody || body,
    };
  }

  return {
    subject: configuredSubject,
    body,
  };
}
