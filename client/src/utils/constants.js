export const STATUS_LABELS = {
  placed: 'Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS = {
  placed: 'badge-placed',
  accepted: 'badge-accepted',
  preparing: 'badge-preparing',
  ready: 'badge-ready',
  served: 'badge-served',
  cancelled: 'badge-cancelled',
};

export const VALID_NEXT_STATUSES = {
  placed: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['served'],
  served: [],
  cancelled: [],
};

export const EVENT_TYPE_LABELS = {
  status_change: 'Status Changed',
  line_added: 'Line Added',
  line_voided: 'Line Voided',
  note_added: 'Note Added',
  collaborator_added: 'Collaborator Added',
  collaborator_removed: 'Collaborator Removed',
};
