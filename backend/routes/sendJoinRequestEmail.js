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
  const { userName, userEmail, destination, hostEmail } = req.body;
  
  try {
    const mailOptions = {
      from: '"Travel Buddy App" <noreply@travelbuddy.com>',
      to: hostEmail,
      subject: `New Join Request for Trip: ${destination?.address}`,
      html: `
        <h2>Hello Trip Host,</h2>
        <p>Someone is interested in joining your trip!</p>
        <h3>Trip Details:</h3>
        <p><strong>Title:</strong> ${destination?.address || 'Untitled Trip'}</p>
        
        <h3>User Details:</h3>
        <p><strong>Name:</strong> ${userName || 'Unnamed User'}</p>
        <p><strong>Email:</strong> ${userEmail || 'No email provided'}</p>
        <p><strong>To add this user to your trip, use the email address:</strong> ${userEmail || 'No email provided'}</p>

        <div style="background-color: #e8f4fc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-top: 0;">How to Add This Buddy:</h3>
            <ol style="padding-left: 20px;">
              <li>Open the Travel Buddy app on your device</li>
              <li>Go to your Profile -> My Trips ->select your trip "${destination?.address}"</li>
              <li>Tap on "Add Buddy" </li>
              <li>Enter the user's email: <strong>${userEmail}</strong></li>
              <li>Confirm the addition</li>
            </ol>
            <p>Once added, they'll be able to see all trip details </p>
          </div>

        
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