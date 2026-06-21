import 'dotenv/config';
import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD;

const redisUrl = `redis://:${encodeURIComponent(redisPassword)}@${redisHost}:${redisPort}`;
const redis = new Redis(redisUrl);

async function fixRedis() {
  console.log('🔗 Connecting to Redis host:', redisHost);
  try {
    const result = await redis.config('SET', 'stop-writes-on-bgsave-error', 'no');
    console.log('✅ Result:', result);
    const testKey = 'recovery_test_' + Date.now();
    await redis.set(testKey, 'SUCCESS');
    const testVal = await redis.get(testKey);
    console.log('📝 Test write/read successful:', testVal);
    await redis.del(testKey);
    console.log('🚀 Redis recovery complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fix Redis:', error);
    process.exit(1);
  }
}

fixRedis();
