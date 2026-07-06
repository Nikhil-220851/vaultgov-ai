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
import { DocumentItem } from '../documents.types';

interface DocumentStoreProviderProps {
  children: React.ReactNode;
}

export const DocumentStoreProvider: React.FC<DocumentStoreProviderProps> = ({
  children,
}) => {
  const { state, dispatch } = useDocumentStoreInternal();

  const addDocument = (doc: DocumentItem) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: doc });
  };

  return (
    <DocumentStoreContext.Provider
      value={{
        documents: state.documents,
        isHydrating: state.isHydrating,
        addDocument,
      }}
    >
      {children}
    </DocumentStoreContext.Provider>
  );
};

export default DocumentStoreProvider;
