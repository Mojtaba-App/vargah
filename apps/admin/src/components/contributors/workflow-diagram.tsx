import { ARTICLE_COMMISSION_WORKFLOW_MERMAID } from '@/lib/communications/workflow';

export function WorkflowDiagram() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-muted/30 p-4">
      <h3 className="mb-3 font-semibold">نمودار گردش کار سفارش مطلب</h3>
      <pre className="text-xs leading-relaxed text-muted-foreground" dir="ltr">
        {ARTICLE_COMMISSION_WORKFLOW_MERMAID}
      </pre>
      <p className="mt-2 text-xs text-muted-foreground">
        این نمودار را می‌توانید در{' '}
        <a href="https://mermaid.live" target="_blank" rel="noreferrer" className="text-primary underline">
          mermaid.live
        </a>{' '}
        رندر کنید.
      </p>
    </div>
  );
}
