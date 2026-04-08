const cron = require('node-cron');
const Note = require('../models/note');
const { sendReminderEmail } = require('../services/emailService');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase to get user emails
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const startReminderCron = () => {
    cron.schedule('* * * * *', async () => {
        console.log('[Reminder] Checking at:', new Date().toISOString());

        try {
            const now = new Date();

            const dueReminders = await Note.find({
                reminder: true,
                reminderDate: { $lte: now, $ne: null },
                reminderNotified: { $ne: true }
            });

            if (dueReminders.length === 0) {
                console.log('[Reminder] No reminders due');
                return;
            }

            console.log(`[Reminder] Found ${dueReminders.length} due reminder(s)`);

            for (const note of dueReminders) {
                try {
                    console.log(`🔔 Processing reminder for note: "${note.title}"`);

                    // Get user email from Supabase
                    const { data: { user }, error } = await supabase.auth.admin.getUserById(note.userId);

                    if (error) {
                        console.error(`Failed to get user for ${note.userId}:`, error.message);
                    } else if (user && user.email) {
                        console.log(`📧 Sending email to: ${user.email}`);

                        // Send the email reminder
                        await sendReminderEmail(
                            user.email,
                            note.title,
                            note.reminderDate,
                            note._id
                        );

                        console.log(`✅ Email reminder sent for note: ${note.title}`);
                    } else {
                        console.log(`⚠️ No email found for user: ${note.userId}`);
                    }

                    // Disable the reminder after processing
                    note.reminder = false;
                    note.reminderNotified = true;
                    await note.save();

                    console.log(`✅ Reminder disabled for note: ${note._id}`);

                } catch (noteError) {
                    console.error(`Error processing note ${note._id}:`, noteError.message);
                }
            }

        } catch (error) {
            console.error('[Reminder] Error:', error.message);
        }
    });

    console.log('✅ Email reminder cron job started - checking every minute');
};

module.exports = startReminderCron;