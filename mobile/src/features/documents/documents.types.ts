export type VisualState = 'danger' | 'warning' | 'success' | 'info' | 'neutral';

export type DocumentCategory = 'Govt IDs' | 'Certificates' | 'Education' | 'Other';

export interface DocumentItem {
  id: string;
  title: string;
  subtitle: string;
  expiryText: string;
  category: DocumentCategory;
  state: VisualState;
  iconName: string;
  /** ISO date string — present only on documents added at runtime */
  savedAt?: string;
  /** Original asset URI — present only on documents added via the upload flow */
  assetUri?: string;
}
