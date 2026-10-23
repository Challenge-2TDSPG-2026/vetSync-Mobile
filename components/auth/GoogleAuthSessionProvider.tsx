import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_CLIENT_IDS, loginGoogleDisponivel } from '../../constants/googleAuth';

WebBrowser.maybeCompleteAuthSession();

type GoogleCallbacks = {
  onIdToken: (idToken: string) => void | Promise<void>;
  onErro: (mensagem: string) => void;
};

type GoogleAuthSessionValue = {
  pronta: boolean;
  iniciar: (callbacks: GoogleCallbacks) => void;
};

const GoogleAuthSessionContext = createContext<GoogleAuthSessionValue | null>(null);

export function GoogleAuthSessionProvider({ children }: React.PropsWithChildren) {
  if (!loginGoogleDisponivel()) {
    return <GoogleAuthSessionContext.Provider value={null}>{children}</GoogleAuthSessionContext.Provider>;
  }

  return <GoogleAuthSessionProviderAtivo>{children}</GoogleAuthSessionProviderAtivo>;
}

function GoogleAuthSessionProviderAtivo({ children }: React.PropsWithChildren) {
  const callbacksPendentes = useRef<GoogleCallbacks | null>(null);
  const ultimaRespostaTratada = useRef<unknown>(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_CLIENT_IDS.web,
    androidClientId: GOOGLE_CLIENT_IDS.android,
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    selectAccount: true,
  });

  useEffect(() => {
    if (!response || ultimaRespostaTratada.current === response) return;
    ultimaRespostaTratada.current = response;

    const callbacks = callbacksPendentes.current;
    callbacksPendentes.current = null;
    if (!callbacks) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (typeof idToken === 'string' && idToken) {
        void callbacks.onIdToken(idToken);
      } else {
        callbacks.onErro('Não recebemos a confirmação do Google. Tente novamente.');
      }
    } else if (response.type === 'error') {
      callbacks.onErro('O Google não conseguiu concluir o login. Tente novamente.');
    }
    // Cancelamento e dispensa são ações intencionais da pessoa.
  }, [response]);

  const iniciar = useCallback((callbacks: GoogleCallbacks) => {
    if (!request) {
      callbacks.onErro('O login com Google ainda está sendo preparado. Tente novamente.');
      return;
    }

    callbacksPendentes.current = callbacks;
    void promptAsync().catch(() => {
      if (callbacksPendentes.current === callbacks) {
        callbacksPendentes.current = null;
        callbacks.onErro('O Google não conseguiu abrir. Tente novamente.');
      }
    });
  }, [promptAsync, request]);

  const value = React.useMemo(() => ({ pronta: Boolean(request), iniciar }), [iniciar, request]);

  return (
    <GoogleAuthSessionContext.Provider value={value}>
      {children}
    </GoogleAuthSessionContext.Provider>
  );
}

export function useGoogleAuthSession() {
  const session = useContext(GoogleAuthSessionContext);
  if (!session) throw new Error('GoogleAuthSessionProvider não está disponível.');
  return session;
}
