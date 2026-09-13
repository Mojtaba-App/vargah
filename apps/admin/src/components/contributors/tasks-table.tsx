'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@vargah/ui/components/badge';
import { DataTable } from '@/components/ui/data-table';
import { formatJalali } from '@/lib/utils';
import { TaskStatus } from '@vargah/database/enums';

type TaskRow = {
  id: string;
  title: string;
  contributorName: string | null;
  issueNumber: number | null;
  status: TaskStatus;
  dueDate: string | null;
  assignedToName: string | null;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'در حال نگارش',
  IN_PROGRESS: 'در حال انجام',
  SUBMITTED: 'ارسال‌شده',
  IN_REVIEW: 'در بازبینی',
  APPROVED: 'تأییدشده',
  REJECTED: 'ردشده',
};

const columns: ColumnDef<TaskRow>[] = [
  { accessorKey: 'title', header: 'عنوان' },
  { accessorKey: 'contributorName', header: 'همکار', cell: ({ row }) => row.original.contributorName ?? '—' },
  {
    accessorKey: 'issueNumber',
    header: 'شماره',
    cell: ({ row }) => (row.original.issueNumber ? `#${row.original.issueNumber}` : '—'),
  },
  {
    accessorKey: 'status',
    header: 'وضعیت',
    cell: ({ row }) => <Badge variant="outline">{STATUS_LABELS[row.original.status]}</Badge>,
  },
  {
    accessorKey: 'dueDate',
    header: 'مهلت',
    cell: ({ row }) => (row.original.dueDate ? formatJalali(row.original.dueDate) : '—'),
  },
  { accessorKey: 'assignedToName', header: 'مسئول', cell: ({ row }) => row.original.assignedToName ?? '—' },
];

export function TasksTable({ data }: { data: TaskRow[] }) {
  return <DataTable columns={columns} data={data} searchKey="title" />;
}
