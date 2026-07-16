import { create } from 'zustand';
import { apiClient, VaultGovDocument } from '@/services/api';

export interface DocumentStoreState {
  documents: VaultGovDocument[];
  isHydrating: boolean;
  addDocument: (doc: VaultGovDocument) => void;
  removeDocument: (id: string) => void;
  fetchDocuments: () => Promise<void>;
}

export const useDocumentStore = create<DocumentStoreState>((set) => ({
  documents: [],
  isHydrating: true,
  addDocument: (doc) => 
    set((state) => ({ documents: [doc, ...state.documents] })),
  removeDocument: (id) =>
    set((state) => ({ documents: state.documents.filter(d => d.id !== id) })),
  fetchDocuments: async () => {
    try {
      const docs = await apiClient.getDocuments();
      set({ documents: docs, isHydrating: false });
    } catch (err) {
      console.warn('[DocumentStore] Failed to fetch documents:', err);
      set({ isHydrating: false });
    }
  },
}));
