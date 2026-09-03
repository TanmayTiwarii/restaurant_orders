import React from 'react';
import Badge from '../common/Badge';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const colorClass = STATUS_COLORS[status] || 'badge-served';

  return <Badge variant={colorClass}>{label}</Badge>;
}
