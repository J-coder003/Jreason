// Theme Selection Logic
document.getElementById('themeSelector').addEventListener('change', (event) => {
  const selectedTheme = event.target.value;
  document.body.className = selectedTheme;
});

// Scheduled Message Logic
document.getElementById('scheduleMessageBtn').addEventListener('click', () => {
  const scheduleTime = prompt("Enter the time to send the message (in HH:MM format):");
  if (scheduleTime) {
    alert(Message scheduled for ${scheduleTime});
    // Here you can add the logic to store the message and time
  }
});

// Settings Panel Logic
document.getElementById('settingsBtn').addEventListener('click', () => {
  const settingsPanel = document.getElementById('settingsPanel');
  settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
});

// Voice Note Logic (WhatsApp Style)
let mediaRecorder;
let audioChunks = [];

document.getElementById('voiceNoteBtn').addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Append audio to chat for playback before sending
      document.getElementById('chat-box').innerHTML += <audio controls src="${audioUrl}"></audio>;

      // Reset chunks
      audioChunks = [];
    };

    setTimeout(() => {
      mediaRecorder.stop(); // Automatically stop after 5 seconds (or set time)
    }, 5000);
  });
});

document.getElementById('sendBtn').addEventListener('click', () => {
  // Logic to send the message
  alert('Message sent!');
});

// Call Functionality (Placeholder)
document.getElementById('callBtn').addEventListener('click', () => {
  alert("Initiating a call...");
  // WebRTC or other logic to start a call goes here
});

document.getElementById('endCallBtn').addEventListener('click', () => {
  alert("Ending the call...");
  // Logic to end the call
});

// Logout Logic
document.getElementById('logoutBtn').addEventListener('click', () => {
  alert("Logging out...");
  // Redirect to login page
  window.location.href = 'login.html';
});

// Settings Logout
document.getElementById('logoutBtnSettings').addEventListener('click', () => {
  alert("Logging out from settings...");
  // Redirect to login page
  window.location.href = 'login.html';
});
