export type VisualState = 'danger' | 'warning' | 'success' | 'info' | 'neutral';

export interface DocumentItem {
  id: string;
  title: string;
  subtitle: string;
  expiryText: string;
  category: 'Govt IDs' | 'Certificates' | 'Education' | 'Other';
  state: VisualState;
  iconName: string;
}
