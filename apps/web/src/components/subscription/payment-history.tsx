import { formatJalaliDate } from '@/lib/date';
import { formatPrice } from '@/lib/utils';

type PaymentRecord = {
  id: string;
  date: Date | string;
  amount: number;
  plan: string;
  status: 'paid' | 'pending' | 'failed';
};

type PaymentHistoryProps = {
  payments: PaymentRecord[];
  title?: string;
};

const statusLabels = {
  paid: 'پرداخت‌شده',
  pending: 'در انتظار',
  failed: 'ناموفق',
};

export function PaymentHistory({ payments, title }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div>
        {title && <h3 className="mb-3 font-semibold">{title}</h3>}
        <div className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          هنوز پرداختی ثبت نشده است.
        </div>
      </div>
    );
  }

  return (
    <div>
      {title && <h3 className="mb-3 font-semibold">{title}</h3>}
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-start font-medium">تاریخ</th>
            <th className="px-4 py-3 text-start font-medium">پلن</th>
            <th className="px-4 py-3 text-start font-medium">مبلغ</th>
            <th className="px-4 py-3 text-start font-medium">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">{formatJalaliDate(payment.date, 'D MMMM YYYY')}</td>
              <td className="px-4 py-3">{payment.plan}</td>
              <td className="px-4 py-3">{formatPrice(payment.amount)} تومان</td>
              <td className="px-4 py-3">
                <span
                  className={
                    payment.status === 'paid'
                      ? 'font-medium text-emerald-700 dark:text-emerald-300'
                      : payment.status === 'pending'
                        ? 'font-medium text-sky-700 dark:text-sky-300'
                        : 'font-medium text-rose-700 dark:text-rose-300'
                  }
                >
                  {statusLabels[payment.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
