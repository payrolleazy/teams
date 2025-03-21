export const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
    clientSecret: process.env.MS_CLIENT_SECRET,
    redirectUri: process.env.MS_REDIRECT_URI,
    postLoginRedirect: process.env.POST_LOGIN_REDIRECT || 'https://your-weweb-app-url.com/dashboard'
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            break;
          case 1:
            console.warn(message);
            break;
          case 2:
            console.info(message);
            break;
          case 3:
            console.debug(message);
            break;
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3
    }
  }
};

export const GRAPH_API_ENDPOINTS = {
  ME: 'https://graph.microsoft.com/v1.0/me',
  CREATE_MEETING: 'https://graph.microsoft.com/v1.0/me/onlineMeetings',
  SEND_MAIL: 'https://graph.microsoft.com/v1.0/me/sendMail'
};

export const SCOPES = {
  USER_READ: ['User.Read'],
  MEETINGS: ['OnlineMeetings.ReadWrite'],
  MAIL_SEND: ['Mail.Send']
};
