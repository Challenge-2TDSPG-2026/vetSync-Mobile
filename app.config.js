const { execSync } = require('node:child_process');
const appJson = require('./app.json');

const FULL_SHA = /^[0-9a-f]{40}$/i;

function readGitHash() {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

/**
 * Commit exibido na tela "Sobre o projeto".
 * Ordem: valor explícito -> commit informado pela plataforma (EAS, Vercel, CI) -> git local.
 * Só aceita o SHA completo (40 caracteres), igual ao scripts/validate-commit-hash.js.
 */
function resolveCommitHash(env = process.env) {
  const candidates = [
    env.EXPO_PUBLIC_COMMIT_HASH,
    env.EAS_BUILD_GIT_COMMIT_HASH,
    env.VERCEL_GIT_COMMIT_SHA,
    env.GITHUB_SHA,
    env.CI_COMMIT_SHA,
  ];

  const fromEnv = candidates
    .map((value) => value?.trim())
    .find((value) => FULL_SHA.test(value ?? ''));
  const hash = fromEnv ?? readGitHash();

  return hash && FULL_SHA.test(hash) ? hash.toLowerCase() : undefined;
}

/** Data e hora (UTC) da geração do build, no formato AAAAMMDD.HHmm. */
function formatBuildTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const day = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
  return `${day}.${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`;
}

/**
 * Build usado quando não existe número nativo (web e Expo Go).
 * Em apps instalados (EAS/APK/IPA) a tela usa o número nativo real do binário.
 * Ordem: número informado/CI -> data e hora do build (Vercel e outros builds remotos) -> "local".
 */
function resolveBuildNumber(env = process.env, now = new Date()) {
  const fromCi = [env.EXPO_PUBLIC_BUILD_NUMBER, env.GITHUB_RUN_NUMBER, env.CI_PIPELINE_IID]
    .map((value) => value?.trim())
    .find(Boolean);

  if (fromCi) return fromCi;

  const isRemoteBuild = Boolean(env.CI || env.VERCEL || env.EAS_BUILD);
  return isRemoteBuild ? formatBuildTimestamp(now) : 'local';
}

module.exports = ({ config }) => ({
  ...appJson.expo,
  ...config,
  extra: {
    ...appJson.expo.extra,
    ...config?.extra,
    commitHash: resolveCommitHash(),
    buildNumber: resolveBuildNumber(),
  },
});

module.exports.resolveCommitHash = resolveCommitHash;
module.exports.resolveBuildNumber = resolveBuildNumber;