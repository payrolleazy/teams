import axios from 'axios';
import { GRAPH_API_ENDPOINTS } from '../config/microsoft.js';
import { logger } from '../utils/logger.js';
import { sendMeetingEmail } from './emailService.js';

export async function createTeamsMeeting({ accessToken, title, startTime, duration, participants, emailBody }) {
  try {
    // Validate input parameters
    if (!title || !startTime || !duration || !participants?.length) {
      throw new Error('Missing required meeting parameters');
    }

    // Ensure startTime is in the future
    const now = new Date();
    const meetingStart = new Date(startTime);
    if (meetingStart < now) {
      throw new Error('Meeting start time must be in the future');
    }

    const endTime = new Date(meetingStart.getTime() + duration * 60000);
    
    const meetingRequest = {
      subject: title,
      startDateTime: meetingStart.toISOString(),
      endDateTime: endTime.toISOString(),
      participants: {
        attendees: participants.map(email => ({
          upn: email,
          role: 'attendee'
        }))
      },
      lobbyBypassSettings: {
        scope: 'organization',
        isDialInBypassEnabled: false
      },
      allowAttendeeToEnableCamera: true,
      allowAttendeeToEnableMic: true
    };

    const response = await axios.post(
      GRAPH_API_ENDPOINTS.CREATE_MEETING,
      meetingRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    // Send meeting invitations via email
    await sendMeetingEmail({
      accessToken,
      meeting: response.data,
      participants,
      emailBody
    });

    return {
      ...response.data,
      participants: meetingRequest.participants.attendees,
      emailsSent: true
    };
  } catch (error) {
    logger.error('Failed to create Teams meeting:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error('Unauthorized - Token may have expired');
    }
    throw new Error(error.message || 'Meeting creation failed');
  }
}