'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useId, useMemo, useState } from 'react';
import { Button } from '@vargah/ui/components/button';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { collectSearchText, matchesSearchQuery } from '@/lib/filter-by-query';
import { cn } from '@/lib/utils';

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  /** یک ستون — سازگاری با نسخه قبل */
  searchKey?: string;
  /** چند ستون — OR روی مقادیر */
  searchKeys?: string[];
  /** جستجوی سفارشی (مثلاً شماره + عنوان) */
  getSearchText?: (row: T) => string | string[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  onExport?: () => void;
  emptyMessage?: string;
  /** عنوان دسترس‌پذیر جدول */
  caption?: string;
};

function sortAria(value: false | 'asc' | 'desc'): 'none' | 'ascending' | 'descending' {
  if (value === 'asc') return 'ascending';
  if (value === 'desc') return 'descending';
  return 'none';
}

export function DataTable<T>({
  columns,
  data,
  searchKey,
  searchKeys,
  getSearchText,
  searchPlaceholder = 'جستجو...',
  showSearch = true,
  onExport,
  emptyMessage = 'موردی یافت نشد',
  caption = 'جدول داده‌ها',
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const debouncedFilter = useDebouncedValue(globalFilter, 300);
  const tableId = useId();
  const statusId = `${tableId}-status`;

  const resolvedKeys = useMemo(() => {
    if (searchKeys?.length) return searchKeys;
    if (searchKey) return [searchKey];
    return [];
  }, [searchKey, searchKeys]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: debouncedFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      if (getSearchText) {
        const raw = getSearchText(row.original);
        const haystack = Array.isArray(raw) ? collectSearchText(raw) : raw;
        return matchesSearchQuery(haystack, String(filterValue));
      }
      if (resolvedKeys.length === 0) return true;
      return resolvedKeys.some((key) => {
        const val = row.getValue(key);
        return matchesSearchQuery(String(val ?? ''), String(filterValue));
      });
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(1, table.getPageCount());

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showSearch && (
          <SearchInput
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder={searchPlaceholder}
            aria-label="فیلتر جدول"
            aria-controls={tableId}
            className="w-full sm:max-w-sm"
          />
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            خروجی Excel
          </Button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table id={tableId} className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-muted/50">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={canSort ? sortAria(sorted) : undefined}
                      className="px-4 py-3 text-start font-medium"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md text-start hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span aria-hidden="true">
                            {{ asc: ' ↑', desc: ' ↓' }[sorted as string] ?? ''}
                          </span>
                          <span className="sr-only">
                            {sorted === 'asc'
                              ? 'مرتب‌سازی صعودی'
                              : sorted === 'desc'
                                ? 'مرتب‌سازی نزولی'
                                : 'مرتب‌سازی'}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p id={statusId} className="text-sm text-muted-foreground" aria-live="polite">
          {filteredCount.toLocaleString('fa-IR')} مورد
          {pageCount > 1
            ? ` · صفحه ${(pageIndex + 1).toLocaleString('fa-IR')} از ${pageCount.toLocaleString('fa-IR')}`
            : ''}
          {debouncedFilter && globalFilter !== debouncedFilter ? ' · در حال جستجو...' : ''}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-controls={tableId}
            aria-label="صفحه قبلی جدول"
          >
            قبلی
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-controls={tableId}
            aria-label="صفحه بعدی جدول"
          >
            بعدی
          </Button>
        </div>
      </div>
    </div>
  );
}

import { PageBackLink } from '@/components/ui/page-back-link';

export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel = 'بازگشت',
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6 space-y-3">
      {backHref && <PageBackLink href={backHref} label={backLabel} />}
      <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between')}>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
