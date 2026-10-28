export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('AUTH_SECRET env var is required');
  }
  return secret;
}
