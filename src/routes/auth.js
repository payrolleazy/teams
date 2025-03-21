import express from 'express';
import { validateAuthRequest } from '../middleware/validators.js';
import { msalConfig, SCOPES } from '../config/microsoft.js';
import { generateAuthUrl, handleCallback } from '../services/authService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/microsoft', validateAuthRequest, (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const authUrl = generateAuthUrl(
      msalConfig.auth.clientId,
      msalConfig.auth.redirectUri,
      SCOPES.USER_READ.concat(SCOPES.MEETINGS),
      userId
    );
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Error initiating auth flow:', error);
    res.redirect(`${msalConfig.auth.postLoginRedirect}?error=auth_init_failed`);
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${msalConfig.auth.postLoginRedirect}?error=invalid_request`);
    }

    const tokenResponse = await handleCallback(code, state, msalConfig);
    
    // Redirect back to Weweb with success
    res.redirect(`${msalConfig.auth.postLoginRedirect}?auth=success&token=${tokenResponse.accessToken}`);
  } catch (error) {
    logger.error('Error in auth callback:', error);
    if (error.message === 'Invalid state parameter') {
      return res.redirect(`${msalConfig.auth.postLoginRedirect}?error=invalid_state`);
    }
    res.redirect(`${msalConfig.auth.postLoginRedirect}?error=auth_failed`);
  }
});

export { router as authRouter };
