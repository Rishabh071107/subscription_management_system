import dotenv from 'dotenv';
dotenv.config();

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
