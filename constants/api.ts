import { Platform } from 'react-native';

/**
 * preciso lembrar de trocar o endereço quando baixar o Java atualizado
(ex: 'http://192.168.0.10:8080').
 */
function resolverBaseUrl(porta: number): string {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${porta}`;
  }
  return `http://localhost:${porta}`;
}

export const API_BASE_URL = resolverBaseUrl(8080);
export const IA_API_BASE_URL = resolverBaseUrl(8000);
