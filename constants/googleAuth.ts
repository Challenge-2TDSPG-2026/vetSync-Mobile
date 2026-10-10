import { Platform } from 'react-native';

export type GoogleClientIds = { web?: string; android?: string; ios?: string };

function limpar(valor: string | undefined): string | undefined {
  const texto = valor?.trim();
  return texto ? texto : undefined;
}

// IDs de cliente OAuth do Google são públicos (ficam no bundle). O "client secret" NUNCA entra no app:
// o backend valida o id_token só com o client ID, então não existe variável de segredo aqui.
// Importante: o acesso precisa ser estático (process.env.EXPO_PUBLIC_...) para o Expo embutir o valor.
export const GOOGLE_CLIENT_IDS: GoogleClientIds = {
  web: limpar(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  android: limpar(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  ios: limpar(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
};

/** Client ID que vale para a plataforma em execução. Vazio = login com Google indisponível aqui. */
export function googleClientIdDaPlataforma(
  ids: GoogleClientIds = GOOGLE_CLIENT_IDS,
  plataforma: string = Platform.OS,
): string | undefined {
  if (plataforma === 'android') return ids.android;
  if (plataforma === 'ios') return ids.ios;
  return ids.web;
}

export function loginGoogleDisponivel(
  ids: GoogleClientIds = GOOGLE_CLIENT_IDS,
  plataforma: string = Platform.OS,
): boolean {
  return googleClientIdDaPlataforma(ids, plataforma) !== undefined;
}
