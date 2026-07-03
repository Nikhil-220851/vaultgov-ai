import { OverviewItem, AlertItem, SchemeItem, QuickActionItem, HealthScoreInfo } from './types';

export const MOCK_USER = {
  name: 'Nikhil',
  avatarInitials: 'N',
};

export const MOCK_DATE = 'Wednesday, 3 June 2026';

export const MOCK_HEALTH_SCORE: HealthScoreInfo = {
  score: 85,
  total: 100,
  validCount: 12,
  expiringCount: 1,
  missingCount: 2,
};

export const MOCK_OVERVIEW: OverviewItem[] = [
  {
    id: 'docs',
    label: 'Documents',
    count: 12,
    iconName: 'document-text-outline',
    type: 'neutral',
  },
  {
    id: 'expiring',
    label: 'Expiring',
    count: 1,
    iconName: 'alert-circle-outline',
    type: 'warning',
  },
  {
    id: 'schemes',
    label: 'Schemes',
    count: 3,
    iconName: 'radio-button-on-outline',
    type: 'success',
  },
];

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'dl',
    title: 'Driving license',
    expiryInfo: 'Expires Jun 28 · Renew now',
    badgeText: '5 days',
    iconName: 'card-outline',
    accentColor: '#FF3B30',      // dangerRed
    borderColor: '#F1D0D0',      // softPink
    badgeColor: '#FF3B30',
  },
  {
    id: 'inc',
    title: 'Income certificate',
    expiryInfo: 'Renewal recommended',
    badgeText: '30 days',
    iconName: 'document-attach-outline',
    accentColor: '#FF9800',      // primaryOrange
    borderColor: '#FFE0B2',      // soft orange border
    badgeColor: '#FF9800',
  },
];

export const MOCK_SCHEMES: SchemeItem[] = [
  {
    id: 'scholarship',
    title: 'Student scholarship 2026',
    description: 'You match 90% of criteria',
    badgeText: 'New',
    iconName: 'school-outline',
  },
];

export const MOCK_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'upload',
    title: 'Upload document',
    subtitle: 'Photo · PDF · Image',
    iconName: 'cloud-upload-outline',
  },
];
