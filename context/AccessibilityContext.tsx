import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { salvarModoIdoso, carregarModoIdoso } from '../storage/petStorage';

type AccessibilityContextValue = {
  modoIdoso: boolean;
  alternarModoIdoso: (ativo: boolean) => Promise<void>;
  carregando: boolean;
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [modoIdoso, setModoIdoso] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarModoIdoso().then(valor => {
      setModoIdoso(valor);
      setCarregando(false);
    });
  }, []);

  const alternarModoIdoso = useCallback(async (ativo: boolean) => {
    setModoIdoso(ativo);
    await salvarModoIdoso(ativo);
  }, []);

  return (
    <AccessibilityContext.Provider value={{ modoIdoso, alternarModoIdoso, carregando }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility() deve ser usado dentro de <AccessibilityProvider>');
  return ctx;
}