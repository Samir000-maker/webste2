// Rename this file to local-secrets.js and fill in your local credentials.
// local-secrets.js is .gitignored — safe to hardcode values for local dev.
export const SECRETS = {

  // Redis
  REDIS_HOST: 'your-redis-host',
  REDIS_PORT: '6379',
  REDIS_PASSWORD: 'your-redis-password',

  // Cloudflare TURN (fallback)
  HARDCODED_CLOUDFLARE_TURN_TOKEN_ID: 'your-turn-token-id',
  HARDCODED_CLOUDFLARE_TURN_API_TOKEN: 'your-turn-api-token',

};
