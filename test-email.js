require('dotenv').config();
const { sendReminderEmail } = require('./services/emailService');

// Test email
const testEmail = async () => {
    console.log('Testing email...');
    const result = await sendReminderEmail(
        'your-test-email@gmail.com', // Replace with your email
        'Test Note Title',
        new Date(),
        'test-note-id'
    );

    if (result) {
        console.log('✅ Email test successful!');
    } else {
        console.log('❌ Email test failed!');
    }
};

testEmail();