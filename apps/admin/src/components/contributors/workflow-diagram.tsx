import { ARTICLE_COMMISSION_WORKFLOW_MERMAID } from '@/lib/communications/workflow';

export function WorkflowDiagram() {
  return (
    <div className="border-border bg-muted/30 overflow-x-auto rounded-xl border p-4">
      <h3 className="mb-3 font-semibold">نمودار گردش کار سفارش مطلب</h3>
      <pre className="text-muted-foreground text-xs leading-relaxed" dir="ltr">
        {ARTICLE_COMMISSION_WORKFLOW_MERMAID}
      </pre>
      <p className="text-muted-foreground mt-2 text-xs">
        این نمودار را می‌توانید در{' '}
        <a
          href="https://mermaid.live"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline"
        >
          mermaid.live
        </a>{' '}
        رندر کنید.
      </p>
    </div>
  );
}
