import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export async function storeTokens({ userId, accessToken, refreshToken, expiresIn }) {
  try {
    if (!supabase) {
      logger.warn('Supabase client not initialized. Tokens will not be stored.');
      return null;
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const { data, error } = await supabase
      .from('tokens')
      .upsert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      logger.error('Failed to store tokens:', error);
      throw new Error('Failed to store tokens');
    }

    return data;
  } catch (error) {
    logger.error('Error in storeTokens:', error);
    // Don't throw the error, just log it and continue
    return null;
  }
}

export async function getTokens(userId) {
  try {
    if (!supabase) {
      logger.warn('Supabase client not initialized. Cannot retrieve tokens.');
      return null;
    }

    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Failed to get tokens:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error in getTokens:', error);
    return null;
  }
}

export async function isTokenExpired(expiresAt) {
  const now = new Date();
  const expiration = new Date(expiresAt);
  return now >= expiration;
}