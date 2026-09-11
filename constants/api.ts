import { Platform } from 'react-native';

function resolverBaseUrl(porta: number): string {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:8080`;
  }
  return `http://localhost:8080`;
}

export const API_BASE_URL = resolverBaseUrl(8080);
export const IA_API_BASE_URL = resolverBaseUrl(8000);
