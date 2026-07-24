export type VisualState = 'danger' | 'warning' | 'success' | 'info' | 'neutral';

export type DocumentCategory = string;

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
  image_uri?: string;
  extracted_text?: string;
  
  // Phase 5 Smart Vault Fields
  health_score?: number;
  status?: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY' | 'INVALID_DATE';
  expiry_date?: string;
  renewal_priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
  last_opened_at?: string;
  validated_at?: string;
  status_changed_at?: string;
  supports_expiry?: boolean;
}

export interface DashboardSummary {
  total_documents: number;
  active_documents: number;
  expired_documents: number;
  expiring_soon: number;
  documents_without_expiry: number;
  average_health_score: number;
  category_breakdown: Record<string, number>;
  expiry_timeline: any[];
  recent_uploads: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    created_at: string;
  }>;
}
