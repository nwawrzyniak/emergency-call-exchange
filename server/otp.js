import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.error('Redis error:', err));
await client.connect();

const OTP_TTL_SECONDS = 5 * 60;

export async function generateOTP(phone) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await client.setEx(`ece_otp:${phone}`, OTP_TTL_SECONDS, otp);
  return otp;
}

export async function verifyOTP(phone, code) {
  const stored = await client.get(`ece_otp:${phone}`);
  if (!stored) return false;
  const isValid = stored === code;
  if (isValid) await client.del(`ece_otp:${phone}`); // consume OTP — one use only
  return isValid;
}
