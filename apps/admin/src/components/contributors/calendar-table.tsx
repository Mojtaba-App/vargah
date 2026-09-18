'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { formatJalali } from '@/lib/utils';

type CalendarRow = {
  id: string;
  title: string;
  userName: string | null;
  dueDate: string;
  description: string | null;
};

const columns: ColumnDef<CalendarRow>[] = [
  { accessorKey: 'title', header: 'عنوان' },
  { accessorKey: 'userName', header: 'مسئول', cell: ({ row }) => row.original.userName ?? '—' },
  {
    accessorKey: 'dueDate',
    header: 'مهلت تحویل',
    cell: ({ row }) => formatJalali(row.original.dueDate),
  },
  {
    accessorKey: 'description',
    header: 'توضیح',
    cell: ({ row }) => row.original.description ?? '—',
  },
];

export function CalendarTable({ data }: { data: CalendarRow[] }) {
  return <DataTable columns={columns} data={data} searchKey="title" />;
}
