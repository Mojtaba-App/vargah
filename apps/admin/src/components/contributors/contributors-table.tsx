'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@vargah/ui/components/badge';
import { DataTable } from '@/components/ui/data-table';
import { formatJalali, formatPrice } from '@/lib/utils';
import { ContributorType } from '@vargah/database/enums';

type ContributorRow = {
  id: string;
  userName: string | null;
  userEmail: string | null;
  type: ContributorType;
  feePerWord: number | null;
  taskCount: number;
  avgRating: number | null;
  joinedAt: string;
};

const TYPE_LABELS: Record<ContributorType, string> = {
  WRITER: 'نویسنده',
  JOURNALIST: 'خبرنگار',
  DESIGNER: 'طراح',
  PHOTOGRAPHER: 'عکاس',
};

const columns: ColumnDef<ContributorRow>[] = [
  { accessorKey: 'userName', header: 'نام', cell: ({ row }) => row.original.userName ?? '—' },
  { accessorKey: 'userEmail', header: 'ایمیل', cell: ({ row }) => row.original.userEmail ?? '—' },
  {
    accessorKey: 'type',
    header: 'نوع',
    cell: ({ row }) => <Badge variant="outline">{TYPE_LABELS[row.original.type]}</Badge>,
  },
  {
    accessorKey: 'feePerWord',
    header: 'حق‌التحریر',
    cell: ({ row }) =>
      row.original.feePerWord ? `${formatPrice(row.original.feePerWord)} ت/کلمه` : '—',
  },
  { accessorKey: 'taskCount', header: 'وظایف' },
  {
    accessorKey: 'avgRating',
    header: 'امتیاز کیفیت',
    cell: ({ row }) => (row.original.avgRating ? `${row.original.avgRating.toFixed(1)} / ۵` : '—'),
  },
  {
    accessorKey: 'joinedAt',
    header: 'شروع همکاری',
    cell: ({ row }) => formatJalali(row.original.joinedAt),
  },
];

export function ContributorsTable({ data }: { data: ContributorRow[] }) {
  return <DataTable columns={columns} data={data} searchKey="userName" />;
}
