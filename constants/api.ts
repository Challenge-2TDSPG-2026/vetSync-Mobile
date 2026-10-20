const DEFAULT_API_BASE_URL = 'https://app-vetsync-rm563197.azurewebsites.net';

function normalizarBaseUrl(url: string | undefined, padrao: string): string {
  const valor = url?.trim();
  if (!valor) return padrao;

  const comProtocolo = /^[a-z][a-z\d+.-]*:\/\//i.test(valor) ? valor : `https://${valor}`;
  return comProtocolo.replace(/\/+$/, '');
}

// EXPO_PUBLIC_* é incorporada no bundle web durante o build da Vercel.
// Nunca use esta variável para segredos: seu conteúdo fica público no navegador.
export const API_BASE_URL = normalizarBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL,
  DEFAULT_API_BASE_URL
);
export const IA_API_BASE_URL = 'https://vetsync-ia.onrender.com';
export const DOTNET_API_BASE_URL = 'https://vetsync-dotnet.onrender.com';
