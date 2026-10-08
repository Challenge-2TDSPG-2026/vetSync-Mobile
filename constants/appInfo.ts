import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type AppExtra = {
  commitHash?: string;
  buildNumber?: string;
};

const NOT_DEFINED = 'Não definido';
const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

const clean = (value?: string | null) => value?.trim() || undefined;

const commitHash = clean(extra.commitHash) ?? clean(process.env.EXPO_PUBLIC_COMMIT_HASH);

// Em app instalado (APK/IPA), o número nativo é o build real do binário.
// Na web e no Expo Go ele não representa o VetSync, então usa o número gerado no build.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const nativeBuild =
  Platform.OS !== 'web' && !isExpoGo ? clean(Constants.nativeBuildVersion) : undefined;

export const APP_INFO = {
  name: Constants.expoConfig?.name ?? 'VetSync',
  version: Constants.expoConfig?.version ?? '0.1.0',
  build: nativeBuild ?? clean(extra.buildNumber) ?? NOT_DEFINED,
  commitHash: commitHash ?? NOT_DEFINED,
  commitShort: commitHash ? commitHash.slice(0, 7) : NOT_DEFINED,
  hasCommitHash: Boolean(commitHash),
} as const;

// TEMPORÁRIO: remover depois do teste
console.log(
  'APP_INFO debug',
  Platform.OS,
  Constants.executionEnvironment,
  JSON.stringify(Constants.expoConfig?.extra),
  JSON.stringify(APP_INFO),
);