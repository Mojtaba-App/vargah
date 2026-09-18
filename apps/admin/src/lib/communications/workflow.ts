import { canTransition as canTransitionBase } from '@vargah/business/workflow';

import { COMMISSION_STATUS_LABELS, COMMISSION_TRANSITIONS } from '@/lib/contributors/constants';

export { COMMISSION_STATUS_LABELS, COMMISSION_TRANSITIONS };
export { canTransitionBase as canTransition };

export const ARTICLE_COMMISSION_WORKFLOW_MERMAID = `flowchart TD
  A[سردبیر: تعریف سوژه] --> B[تخصیص به نویسنده]
  B --> C[نویسنده: نگارش مطلب]
  C --> D[تحویل پیش‌نویس]
  D --> E[بازبینی سردبیر/ویراستار]
  E -->|تأیید| F[تأیید نهایی]
  E -->|رد| C
  F --> G[انتشار در شماره]

  subgraph reminders [یادآورها]
    R1[۲ روز قبل از Deadline → ایمیل/SMS نویسنده]
    R2[Webhook تلگرام/ایتا → مدیر]
  end

  C -.-> R1
  E -.-> R2`;
