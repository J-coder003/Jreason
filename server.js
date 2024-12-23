const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser'); // To handle POST requests
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 8080;

// Middleware
app.use(cookieParser());
app.use(express.static(path.join(__dirname))); // Serve static files (like CSS, JS, HTML)
app.use(bodyParser.json()); // To parse JSON payloads

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
  "YOUR_CLIENT_ID",
  "YOUR_CLIENT_SECRET",
  "http://localhost:8080/oauth2callback"
);

// Scopes to access Gmail contacts and profile info
const SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Serve the chat app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat-app.html'));
});

// Google OAuth login route
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

// OAuth2 callback route
app.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const peopleService = google.people({ version: 'v1', auth: oauth2Client });
    const response = await peopleService.people.connections.list({
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,emailAddresses',
    });

    const contacts = response.data.connections.map((person) => ({
      name: person.names?.[0]?.displayName || 'Unnamed',
      email: person.emailAddresses?.[0]?.value || 'No Email',
    }));

    res.cookie('gmailContacts', JSON.stringify(contacts), { httpOnly: true });
    res.redirect('/');
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).send('Authentication failed');
  }
});

// Route to serve contacts
app.get('/contacts', (req, res) => {
  const contacts = req.cookies.gmailContacts ? JSON.parse(req.cookies.gmailContacts) : [];
  res.json({ contacts });
});

// Logout route
app.get('/logout', (req, res) => {
  res.clearCookie('gmailContacts');
  res.redirect('/');
});

// Nodemailer email invitation
app.post('/send-invite', (req, res) => {
  const { email } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Join Jreason!',
    text: 'You have been invited to join Jreason. Register here: http://localhost:8080/register.html',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending invite:', error);
      return res.status(500).send('Failed to send invitation');
    }
    res.status(200).send('Invitation sent successfully');
  });
});

// WebSocket logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('sendMessage', (data) => {
    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      io.emit('receiveMessage', { message: data.message }); // Broadcast the message
    } else {
      socket.emit('error', { message: 'Message payload is invalid or empty' }); // Notify sender
      console.error('Invalid message payload received:', data);
    }
  });
  

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
