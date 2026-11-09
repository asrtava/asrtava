import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton } from './SkeletonLoader';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalRecords?: number;
  };
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching this criteria.',
  pagination,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <TableSkeleton rows={6} columns={columns.length} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-subtle">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={col.width ? { width: col.width } : undefined}
                  className={`py-3 px-4 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {data.map((row, rowIdx) => (
              <tr
                key={keyExtractor(row, rowIdx)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-100 ${
                  onRowClick ? 'cursor-pointer hover:bg-brand-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                {columns.map((col, colIdx) => {
                  let content: React.ReactNode = null;
                  if (typeof col.accessor === 'function') {
                    content = col.accessor(row);
                  } else if (col.accessor) {
                    content = (row[col.accessor] as unknown) as React.ReactNode;
                  }

                  return (
                    <td
                      key={colIdx}
                      className={`py-3 px-4 ${
                        col.align === 'right'
                          ? 'text-right font-mono'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600">
          <div>
            {pagination.totalRecords !== undefined ? (
              <span>Total {pagination.totalRecords} records</span>
            ) : (
              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              aria-label="Previous page"
              className="p-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="px-2 font-medium">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              aria-label="Next page"
              className="p-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

