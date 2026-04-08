const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        // 🔐 OWNER
        userId: {
            type: String,
            required: true,
        },

        // 📝 CONTENT
        title: {
            type: String,
            default: "",
        },

        content: {
            type: String,
            default: "",
        },

        // 🔥 SHARING SYSTEM
        sharedWith: [
            {
                email: {
                    type: String,
                    required: true,
                },

                role: {
                    type: String,
                    enum: ["viewer", "editor"],
                    default: "viewer",
                },

                sharedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // 🔗 PUBLIC LINK
        isPublic: {
            type: Boolean,
            default: false,
        },

        publicId: {
            type: String,
        },

        // 📁 TAGS
        tags: {
            type: [String],
            default: [],
        },

        // ⏰ REMINDER SYSTEM (Your original flat structure)
        reminder: {
            type: Boolean,
            default: false,
        },

        reminderDate: {
            type: Date,
            default: null,
        },

        // ✅ REMINDER NOTIFIED FIELD
        reminderNotified: {
            type: Boolean,
            default: false,
        },

        // ✅ PRIVACY PASSWORD FOR PRIVATE NOTES (User-defined)
        privacyPassword: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ✅ ADD INDEXES for better performance
noteSchema.index({ reminder: 1, reminderDate: 1, reminderNotified: 1 });
noteSchema.index({ userId: 1, privacyPassword: 1 });

module.exports = mongoose.model("Note", noteSchema);