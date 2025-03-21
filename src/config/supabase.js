import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

let supabase = null;

try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    logger.warn('Supabase environment variables are missing. Some features may not work properly.');
  } else {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      }
    );
    logger.info('Supabase client initialized successfully');
  }
} catch (error) {
  logger.error('Failed to initialize Supabase client:', error);
}

export { supabase };