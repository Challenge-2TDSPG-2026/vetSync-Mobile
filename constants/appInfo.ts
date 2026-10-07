import Constants from 'expo-constants';

const commitHash = process.env.EXPO_PUBLIC_COMMIT_HASH?.trim();

export const APP_INFO = {
  name: Constants.expoConfig?.name ?? 'VetSync',
  version: Constants.expoConfig?.version ?? '0.1.0',
  build: Constants.nativeBuildVersion ?? Constants.expoConfig?.android?.versionCode?.toString() ?? 'Não definido',
  commitHash: commitHash || 'Não definido',
} as const;
