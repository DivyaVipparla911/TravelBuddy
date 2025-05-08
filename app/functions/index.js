const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Configure email transporter
// NOTE: For production, consider using a dedicated email service provider
const transporter = nodemailer.createTransport({
  service: 'gmail', // or any other email service
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

/**
 * Cloud Function to handle trip join requests and send email notifications
 * Triggered when a new document is created in the 'tripJoinRequests' collection
 */
exports.sendJoinRequestEmail = functions.firestore
  .document('tripJoinRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    try {
      const requestData = snapshot.data();
      const { tripId, userId, message } = requestData;
      
      // Get trip details
      const tripDoc = await db.collection('Trips').doc(tripId).get();
      if (!tripDoc.exists) {
        console.error(`Trip with ID: ${tripId} not found`);
        return null;
      }
      const trip = tripDoc.data();
      
      // Get host details
      const hostDoc = await db.collection('users').doc(trip.userId).get();
      if (!hostDoc.exists) {
        console.error(`Host with ID: ${trip.userId} not found`);
        return null;
      }
      const host = hostDoc.data();
      
      // Get requesting user details
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        console.error(`User with ID: ${userId} not found`);
        return null;
      }
      const user = userDoc.data();
      
      // Compose email content
      const mailOptions = {
        from: '"Travel Buddy App" <noreply@travelbuddy.com>',
        to: host.email,
        subject: `New Join Request for Trip: ${trip.title}`,
        html: `
          <h2>Hello ${host.name || 'Trip Host'},</h2>
          <p>Someone is interested in joining your trip!</p>
          
          <h3>Trip Details:</h3>
          <p><strong>Title:</strong> ${trip.title || 'Untitled Trip'}</p>
          <p><strong>Destination:</strong> ${trip.destination?.address || 'Location not specified'}</p>
          <p><strong>Dates:</strong> ${trip.startDate ? new Date(trip.startDate.toDate()).toLocaleDateString() : 'Not specified'} 
            to ${trip.endDate ? new Date(trip.endDate.toDate()).toLocaleDateString() : 'Not specified'}</p>
          
          <h3>User Details:</h3>
          <p><strong>Name:</strong> ${user.name || 'Unnamed User'}</p>
          <p><strong>Email:</strong> ${user.email || 'No email provided'}</p>
          
          <p><strong>To add this user to your trip, use the email address:</strong> ${user.email || 'No email provided'}</p>
          
          ${message ? `<h3>Message from User:</h3><p>${message}</p>` : ''}
          
          <p>Log in to the Travel Buddy app to review and approve this request.</p>
          <p>Happy traveling!</p>
          <p>The Travel Buddy Team</p>
        `
      };
      
      // Send email
      await transporter.sendMail(mailOptions);
      
      // Update request document to indicate email was sent
      await snapshot.ref.update({ 
        emailSent: true, 
        emailSentAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      
      console.log(`Join request email sent to host: ${host.email}`);
      return null;
    } catch (error) {
      console.error('Error sending join request email:', error);
      return null;
    }
  });