import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { logger } from '../utils/logger.js';

export async function sendMeetingEmail({ accessToken, meeting, participants, emailBody }) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    const defaultEmailBody = {
      html: `
        <h2>Teams Meeting Invitation</h2>
        <p>You have been invited to a Teams meeting.</p>
        <p><strong>Title:</strong> ${meeting.subject}</p>
        <p><strong>Start Time:</strong> ${new Date(meeting.startDateTime).toLocaleString()}</p>
        <p><strong>Join URL:</strong> <a href="${meeting.joinUrl}">${meeting.joinUrl}</a></p>
      `,
      text: `
        Teams Meeting Invitation
        
        You have been invited to a Teams meeting.
        Title: ${meeting.subject}
        Start Time: ${new Date(meeting.startDateTime).toLocaleString()}
        Join URL: ${meeting.joinUrl}
      `
    };

    const finalEmailBody = emailBody || defaultEmailBody;

    const mailRequest = {
      message: {
        subject: `Teams Meeting: ${meeting.subject}`,
        body: {
          contentType: 'HTML',
          content: finalEmailBody.html
        },
        toRecipients: participants.map(email => ({
          emailAddress: { address: email }
        }))
      },
      saveToSentItems: true
    };

    await client.api('/me/sendMail').post(mailRequest);
    logger.info(`Meeting invitation emails sent to ${participants.length} participants`);
    return true;
  } catch (error) {
    logger.error('Failed to send meeting emails:', error);
    throw new Error('Failed to send meeting invitation emails');
  }
}