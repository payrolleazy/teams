import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { storeTokens } from './tokenService.js';

// Store states in memory (consider using Redis in production)
const stateStore = new Map();

export function generateAuthUrl(clientId, redirectUri, scopes, userId) {
  const state = crypto.randomBytes(32).toString('hex');
  stateStore.set(state, { timestamp: Date.now(), userId });
  
  const scope = encodeURIComponent(scopes.join(' '));
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_mode=query`;
}

export async function handleCallback(code, state, config) {
  const stateData = stateStore.get(state);
  if (!stateData) {
    throw new Error('Invalid state parameter');
  }
  
  const { userId } = stateData;
  stateStore.delete(state);

  try {
    const tokenEndpoint = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: config.auth.clientId,
      client_secret: config.auth.clientSecret,
      code,
      redirect_uri: config.auth.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await axios.post(tokenEndpoint, params);
    
    // Store tokens in Supabase
    if (userId) {
      await storeTokens({
        userId,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      });
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    logger.error('Token acquisition failed:', error.response?.data || error.message);
    throw new Error('Failed to acquire token');
  }
}

export async function refreshAccessToken(refreshToken, config) {
  try {
    const tokenEndpoint = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: config.auth.clientId,
      client_secret: config.auth.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await axios.post(tokenEndpoint, params);
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    logger.error('Token refresh failed:', error.response?.data || error.message);
    throw new Error('Failed to refresh token');
  }
}

// Cleanup expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour expiry
      stateStore.delete(state);
    }
  }
}, 300000); // Clean every 5 minutes