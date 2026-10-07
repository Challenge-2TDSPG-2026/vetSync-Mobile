/* global describe, expect, it */

const { validateCommitHash } = require('../validate-commit-hash');

const commitHash = '0123456789abcdef0123456789abcdef01234567';

describe('validateCommitHash', () => {
  it('accepts the exact full SHA used by the publication environment', () => {
    expect(
      validateCommitHash({
        EXPO_PUBLIC_COMMIT_HASH: commitHash,
        EAS_BUILD_GIT_COMMIT_HASH: commitHash,
      }),
    ).toBe(commitHash);
  });

  it('rejects a hash that differs from the publication commit', () => {
    expect(() =>
      validateCommitHash({
        EXPO_PUBLIC_COMMIT_HASH: commitHash,
        GITHUB_SHA: 'fedcba9876543210fedcba9876543210fedcba98',
      }),
    ).toThrow('não corresponde ao commit usado na publicação');
  });

  it('rejects abbreviated hashes', () => {
    expect(() =>
      validateCommitHash({
        EXPO_PUBLIC_COMMIT_HASH: commitHash.slice(0, 7),
        GITHUB_SHA: commitHash,
      }),
    ).toThrow('exatamente 40 caracteres');
  });
});
