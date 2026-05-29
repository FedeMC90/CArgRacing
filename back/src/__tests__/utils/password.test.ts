import { hashPassword, comparePassword } from '../../utils/password';

describe('password utils', () => {
  const plain = 'mySecurePassword123';

  it('hashPassword returns a string different from the plain text', async () => {
    const hash = await hashPassword(plain);
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(plain);
  });

  it('hashPassword produces different hashes on each call', async () => {
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(hash1).not.toBe(hash2);
  });

  it('comparePassword returns true for the correct password', async () => {
    const hash = await hashPassword(plain);
    const result = await comparePassword(plain, hash);
    expect(result).toBe(true);
  });

  it('comparePassword returns false for an incorrect password', async () => {
    const hash = await hashPassword(plain);
    const result = await comparePassword('wrongPassword', hash);
    expect(result).toBe(false);
  });
});
