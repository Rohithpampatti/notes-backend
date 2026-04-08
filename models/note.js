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

        // ✅ ADD THIS ONE NEW FIELD (missing from your model)
        reminderNotified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// ✅ ADD INDEX for better performance (optional but recommended)
noteSchema.index({ reminder: 1, reminderDate: 1, reminderNotified: 1 });

module.exports = mongoose.model("Note", noteSchema);