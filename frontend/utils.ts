import type { CertStatus } from './types';

export const calculateStatus = (expiryDate: string): CertStatus => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 60) return 'Expiring Soon';
  return 'Compliant';
};

export const getDynamicDate = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const getStatusColor = (status: CertStatus) => {
  switch (status) {
    case 'Compliant':
      return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'Expiring Soon':
      return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Expired':
      return 'text-rose-600 bg-rose-50 border-rose-100';
    case 'Pending Approval':
      return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'Rejected':
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};
