/**
 * رندر قالب پیام با متغیرهای {{name}} style
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export const DEFAULT_TEMPLATE_KEYS = {
  SUBSCRIPTION_EXPIRY_7D: 'subscription_expiry_7d',
  SUBSCRIPTION_EXPIRY_1D: 'subscription_expiry_1d',
  COMMISSION_DEADLINE: 'commission_deadline',
  TICKET_REPLY: 'ticket_reply',
  TICKET_RESOLVED: 'ticket_resolved',
  MESSAGE_REPLY: 'message_reply',
} as const;
