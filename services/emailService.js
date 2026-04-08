const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail app password
    }
});

// Function to send reminder email
const sendReminderEmail = async (toEmail, title, reminderDate, noteId) => {
    try {
        const mailOptions = {
            from: `"Notes App" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `📝 Reminder: ${title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #3b82f6;">📝 Note Reminder</h2>
                    <p>Your note has a reminder scheduled for:</p>
                    <p style="font-size: 18px; font-weight: bold; color: #eab308;">
                        ${new Date(reminderDate).toLocaleString()}
                    </p>
                    <h3>Note: ${title}</h3>
                    <a href="http://localhost:5173" style="display: inline-block; margin-top: 20px; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Open Notes App
                    </a>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        This is an automated reminder from your Notes App.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${toEmail}:`, info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email error:', error.message);
        return false;
    }
};

module.exports = { sendReminderEmail };