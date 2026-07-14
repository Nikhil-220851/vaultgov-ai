/**
 * useDocumentStore.ts
 *
 * Lightweight document state store built with React Context + useReducer.
 *
 * Hydration strategy:
 *  1. On mount, fetch documents from the backend via apiClient.getDocuments().
 *  2. State is stored in React Context — no AsyncStorage, no mock data.
 *  3. Persistence is handled by the FastAPI backend (PostgreSQL).
 *
 * No external state library is required. All consumers use useDocumentStore().
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  Dispatch,
} from 'react';
import { apiClient, VaultGovDocument } from '@/services/api';


// ─── State & Actions ──────────────────────────────────────────────────────────

export interface DocumentStoreState {
  documents: VaultGovDocument[];
  /** True until the initial AsyncStorage read completes. */
  isHydrating: boolean;
}

export type DocumentStoreAction =
  | { type: 'HYDRATE'; payload: VaultGovDocument[] }
  | { type: 'ADD_DOCUMENT'; payload: VaultGovDocument }
  | { type: 'DELETE_DOCUMENT'; payload: string };

function reducer(
  state: DocumentStoreState,
  action: DocumentStoreAction,
): DocumentStoreState {
  switch (action.type) {
    case 'HYDRATE':
      return { documents: action.payload, isHydrating: false };
    case 'ADD_DOCUMENT':
      return {
        ...state,
        documents: [action.payload, ...state.documents],
      };
    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(d => d.id !== action.payload),
      };
    default:
      return state;
  }
}

const initialState: DocumentStoreState = {
  documents: [],
  isHydrating: true,
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface DocumentStoreContextValue {
  documents: VaultGovDocument[];
  isHydrating: boolean;
  addDocument: (doc: VaultGovDocument) => void;
  deleteDocument: (id: string) => void;
  fetchDocuments: () => Promise<void>;
}

export const DocumentStoreContext = createContext<DocumentStoreContextValue>(null!);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentStore(): DocumentStoreContextValue {
  const ctx = useContext(DocumentStoreContext);
  if (!ctx) {
    throw new Error('useDocumentStore must be used within a DocumentStoreProvider');
  }
  return ctx;
}

// ─── Internal hook used by the Provider ──────────────────────────────────────

export function useDocumentStoreInternal(): {
  state: DocumentStoreState;
  dispatch: Dispatch<DocumentStoreAction>;
  fetchDocuments: () => Promise<void>;
} {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchDocuments = async () => {
    try {
      const docs = await apiClient.getDocuments();
      dispatch({ type: 'HYDRATE', payload: docs });
    } catch (err) {
      console.warn('[DocumentStore] Failed to fetch documents:', err);
      dispatch({ type: 'HYDRATE', payload: [] });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return { state, dispatch, fetchDocuments };
}
