/**
 * DocumentStoreProvider.tsx
 *
 * Wraps the app with the DocumentStore context so any screen can consume
 * documents and dispatch actions. Mount this once in the root _layout.tsx.
 */

import React from 'react';
import {
  DocumentStoreContext,
  useDocumentStoreInternal,
} from './useDocumentStore';
import { VaultGovDocument } from '@/services/api';

interface DocumentStoreProviderProps {
  children: React.ReactNode;
}

export const DocumentStoreProvider: React.FC<DocumentStoreProviderProps> = ({
  children,
}) => {
  const { state, dispatch, fetchDocuments } = useDocumentStoreInternal();

  const addDocument = (doc: VaultGovDocument) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: doc });
  };

  const deleteDocument = (id: string) => {
    dispatch({ type: 'DELETE_DOCUMENT', payload: id });
  };

  return (
    <DocumentStoreContext.Provider
      value={{
        documents: state.documents,
        isHydrating: state.isHydrating,
        addDocument,
        deleteDocument,
        fetchDocuments,
      }}
    >
      {children}
    </DocumentStoreContext.Provider>
  );
};

export default DocumentStoreProvider;
