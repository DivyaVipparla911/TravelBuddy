// utils/emailService.js
import axios from 'axios';

const sendJoinRequestEmail = async (emailData) => {
  const templateParams = {
    to_email: emailData.hostEmail,
    host_name: emailData.hostName,
    traveler_name: emailData.travelerName,
    traveler_email: emailData.travelerEmail,
    trip_name: emailData.tripName,
    trip_dates: emailData.tripDates,
    trip_location: emailData.tripLocation,
    meeting_point: emailData.meetingPoint,
  };

  try {
    const response = await axios.post(
      'https://api.emailjs.com/api/v1.0/email/send',
      {
        service_id: 'service_gcolgcx',
        template_id: 'template_szc1qwr',
        user_id: 'YOUR_USER_ID', // From EmailJS dashboard
        template_params: templateParams,
      }
    );
    console.log('Email sent:', response.status);
    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
};

export default sendJoinRequestEmail;