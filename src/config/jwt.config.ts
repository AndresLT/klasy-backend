import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  expiresIn: '1h',
}));