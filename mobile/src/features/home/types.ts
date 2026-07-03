export interface OverviewItem {
  id: string;
  label: string;
  count: number;
  iconName: string;
  type: 'neutral' | 'warning' | 'success';
}

export interface AlertItem {
  id: string;
  title: string;
  expiryInfo: string;
  badgeText: string;
  iconName: string;
  accentColor: string;
  borderColor: string;
  badgeColor: string;
}

export interface SchemeItem {
  id: string;
  title: string;
  description: string;
  badgeText: string;
  iconName: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
}

export interface HealthScoreInfo {
  score: number;
  total: number;
  validCount: number;
  expiringCount: number;
  missingCount: number;
}
