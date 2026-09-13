'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Badge } from '@vargah/ui/components/badge';
import { DataTable } from '@/components/ui/data-table';
import { formatJalali } from '@/lib/utils';
import { CommissionStatus } from '@vargah/database/enums';
import { COMMISSION_STATUS_LABELS } from '@/lib/communications/workflow';

type CommissionRow = {
  id: string;
  title: string;
  status: CommissionStatus;
  assigneeName: string | null;
  dueDate: string | null;
  createdAt: string;
};

const columns: ColumnDef<CommissionRow>[] = [
  {
    accessorKey: 'title',
    header: 'سوژه',
    cell: ({ row }) => (
      <Link href={`/contributors/workflow/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'مرحله',
    cell: ({ row }) => <Badge variant="outline">{COMMISSION_STATUS_LABELS[row.original.status]}</Badge>,
  },
  { accessorKey: 'assigneeName', header: 'نویسنده', cell: ({ row }) => row.original.assigneeName ?? '—' },
  {
    accessorKey: 'dueDate',
    header: 'مهلت',
    cell: ({ row }) => (row.original.dueDate ? formatJalali(row.original.dueDate) : '—'),
  },
  {
    accessorKey: 'createdAt',
    header: 'ایجاد',
    cell: ({ row }) => formatJalali(row.original.createdAt),
  },
];

export function CommissionsTable({ data }: { data: CommissionRow[] }) {
  return <DataTable columns={columns} data={data} searchKey="title" searchPlaceholder="جستجوی سفارش..." />;
}
