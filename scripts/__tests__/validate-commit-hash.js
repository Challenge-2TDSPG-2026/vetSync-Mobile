const COMMIT_HASH_PATTERN = /^[0-9a-f]{40}$/;

const EXPECTED_COMMIT_VARIABLES = [
  'EAS_BUILD_GIT_COMMIT_HASH',
  'VERCEL_GIT_COMMIT_SHA',
  'GITHUB_SHA',
  'CI_COMMIT_SHA',
];

function getExpectedCommitHash(env = process.env) {
  return EXPECTED_COMMIT_VARIABLES.map((name) => env[name]?.trim()).find(Boolean);
}

function validateCommitHash(env = process.env) {
  const displayedHash = env.EXPO_PUBLIC_COMMIT_HASH?.trim();
  const expectedHash = getExpectedCommitHash(env);

  if (!displayedHash) {
    throw new Error(
      'EXPO_PUBLIC_COMMIT_HASH é obrigatório para publicação e deve conter o SHA completo do commit.',
    );
  }

  if (!COMMIT_HASH_PATTERN.test(displayedHash)) {
    throw new Error(
      'EXPO_PUBLIC_COMMIT_HASH deve conter exatamente 40 caracteres hexadecimais do SHA completo.',
    );
  }

  if (!expectedHash) {
    throw new Error(
      'Não foi possível identificar o commit da publicação. Execute a validação em EAS, Vercel ou CI.',
    );
  }

  if (displayedHash !== expectedHash) {
    throw new Error(
      `O hash exibido (${displayedHash}) não corresponde ao commit usado na publicação (${expectedHash}).`,
    );
  }

  return displayedHash;
}

if (require.main === module) {
  try {
    validateCommitHash();
    console.log('Commit hash validado: corresponde exatamente ao commit da publicação.');
  } catch (error) {
    console.error(`Validação do commit falhou: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { getExpectedCommitHash, validateCommitHash };
