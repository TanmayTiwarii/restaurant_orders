import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 0',
        marginTop: '1rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
      }}
    >
      <div>
        Showing <strong style={{ color: 'var(--text-primary)' }}>{startItem}</strong> to{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{endItem}</strong> of{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> orders
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>

        <span style={{ margin: '0 0.5rem', fontWeight: 600 }}>
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
