/**
 * useDocumentStore.ts
 *
 * Lightweight document state store built with React Context + useReducer.
 *
 * Hydration strategy:
 *  1. On mount, attempt to read persisted documents from AsyncStorage.
 *  2. If persisted data exists, use it (MOCK_DOCUMENTS is NOT applied).
 *  3. If no persisted data exists (first install), seed with MOCK_DOCUMENTS.
 *  4. Persistence to AsyncStorage is triggered only AFTER hydration completes,
 *     preventing accidental overwrite of stored docs on re-render.
 *
 * No external state library is required. All consumers use useDocumentStore().
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  Dispatch,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentItem } from '../documents.types';
import { MOCK_DOCUMENTS } from '../documents.constants';

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = '@vaultgov/documents_v1';

// ─── State & Actions ──────────────────────────────────────────────────────────

export interface DocumentStoreState {
  documents: DocumentItem[];
  /** True until the initial AsyncStorage read completes. */
  isHydrating: boolean;
}

export type DocumentStoreAction =
  | { type: 'HYDRATE'; payload: DocumentItem[] }
  | { type: 'ADD_DOCUMENT'; payload: DocumentItem };

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
  documents: DocumentItem[];
  isHydrating: boolean;
  addDocument: (doc: DocumentItem) => void;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const DocumentStoreContext = createContext<DocumentStoreContextValue>(null!);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentStore(): DocumentStoreContextValue {
  const ctx = useContext(DocumentStoreContext);
  if (!ctx) {
    throw new Error('useDocumentStore must be used within a DocumentStoreProvider');
  }
  return ctx;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

async function persistDocuments(docs: DocumentItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.warn('[DocumentStore] Failed to persist documents:', err);
  }
}

async function loadDocuments(): Promise<DocumentItem[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DocumentItem[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (err) {
    console.warn('[DocumentStore] Failed to load persisted documents:', err);
    return null;
  }
}

// ─── Internal hook used by the Provider ──────────────────────────────────────

export function useDocumentStoreInternal(): {
  state: DocumentStoreState;
  dispatch: Dispatch<DocumentStoreAction>;
} {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Track whether hydration has completed so we never persist before it.
  const hydratedRef = useRef(false);

  // ── Step 1: Hydrate from AsyncStorage on mount ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persisted = await loadDocuments();
      if (cancelled) return;

      if (persisted !== null) {
        // Use stored documents — do NOT fall back to seed data
        dispatch({ type: 'HYDRATE', payload: persisted });
      } else {
        // First install: seed with mock data
        dispatch({ type: 'HYDRATE', payload: MOCK_DOCUMENTS });
      }
      hydratedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Step 2: Persist to AsyncStorage only AFTER hydration completes ────────
  useEffect(() => {
    if (!hydratedRef.current) return; // Skip pre-hydration renders
    persistDocuments(state.documents);
  }, [state.documents]);

  return { state, dispatch };
}
