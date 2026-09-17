import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { salvarModoSimples, carregarModoSimples } from '../storage/petStorage';

type AccessibilityContextValue = {
  modoSimples: boolean;
  alternarModoSimples: (ativo: boolean) => Promise<void>;
  carregando: boolean;
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [modoSimples, setModoSimples] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarModoSimples().then(valor => {
      setModoSimples(valor);
      setCarregando(false);
    });
  }, []);

  const alternarModoSimples = useCallback(async (ativo: boolean) => {
    setModoSimples(ativo);
    await salvarModoSimples(ativo);
  }, []);

  return (
    <AccessibilityContext.Provider value={{ modoSimples, alternarModoSimples, carregando }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility() deve ser usado dentro de <AccessibilityProvider>');
  return ctx;
}