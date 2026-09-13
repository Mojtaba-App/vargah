import { PageHeader } from '@/components/ui/data-table';
import { NewTicketForm } from '@/components/crm/new-ticket-form';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';

export default async function NewTicketPage() {
  await requirePermission(PERMISSIONS.TICKET_MANAGE);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="تیکت جدید"
        description="ثبت درخواست مشتری"
        backHref="/crm/tickets"
        backLabel="بازگشت به تیکت‌ها"
      />
      <NewTicketForm />
    </div>
  );
}
