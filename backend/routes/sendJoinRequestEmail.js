// routes/sendJoinRequestEmail.js
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();
const router = express.Router();

// Set up the transporter for sending emails using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Route to send the join request email
router.post('/send-join-request-email', (req, res) => {
  const { userName, userEmail, tripTitle, hostEmail } = req.body;
  
  try {
    const mailOptions = {
      from: '"Travel Buddy App" <noreply@travelbuddy.com>',
      to: hostEmail,
      subject: `New Join Request for Trip: ${tripTitle}`,
      html: `
        <h2>Hello Trip Host,</h2>
        <p>Someone is interested in joining your trip!</p>
        <h3>Trip Details:</h3>
        <p><strong>Title:</strong> ${tripTitle || 'Untitled Trip'}</p>
        
        <h3>User Details:</h3>
        <p><strong>Name:</strong> ${userName || 'Unnamed User'}</p>
        <p><strong>Email:</strong> ${userEmail || 'No email provided'}</p>
        <p><strong>To add this user to your trip, use the email address:</strong> ${userEmail || 'No email provided'}</p>
        
        <p>Log in to the Travel Buddy app to review and approve this request.</p>
        <p>Happy traveling!</p>
        <p>The Travel Buddy Team</p>
      `,
      
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Email sent successfully' });
    });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;