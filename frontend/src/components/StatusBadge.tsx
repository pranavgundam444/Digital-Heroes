import { LeadStatus } from '../api/client';

interface StatusBadgeProps {
  status: LeadStatus;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  WON: 'Won',
  LOST: 'Lost',
};

const STATUS_DOTS: Record<LeadStatus, string> = {
  NEW: '●',
  CONTACTED: '●',
  QUALIFIED: '●',
  PROPOSAL: '●',
  WON: '●',
  LOST: '●',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return (
    <span className={cls}>
      <span style={{ fontSize: '8px' }}>{STATUS_DOTS[status]}</span>
      {STATUS_LABELS[status]}
    </span>
  );
}

interface RoleBadgeProps {
  role: 'ADMIN' | 'MEMBER';
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={`badge badge-${role.toLowerCase()}`}>
      {role === 'ADMIN' ? '⚡ Admin' : '👤 Member'}
    </span>
  );
}
