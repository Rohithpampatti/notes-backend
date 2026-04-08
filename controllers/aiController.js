const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a summary of note content using Google Gemini API
 * FREE tier available: 60 requests per minute
 */
const summarizeNote = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required for summarization' });
        }

        // Truncate content if too long (Gemini has token limits)
        const truncatedContent = content.length > 10000
            ? content.substring(0, 10000) + '...'
            : content;

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Create prompt for summarization
        const prompt = `Please provide a concise summary of the following text. Keep it brief (2-3 sentences maximum) and capture only the most important points:\n\n${truncatedContent}`;

        // Generate summary
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        // Clean up the summary
        const cleanSummary = summary
            .trim()
            .replace(/^["']|["']$/g, '') // Remove quotes if present
            .replace(/^Summary:?\s*/i, ''); // Remove "Summary:" prefix if present

        res.json({
            summary: cleanSummary,
            provider: 'google-gemini',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI Summarization error:', error);

        // Handle specific Gemini errors
        if (error.message.includes('API key')) {
            return res.status(401).json({
                error: 'Invalid Gemini API key. Please check your configuration.'
            });
        }

        if (error.message.includes('quota')) {
            return res.status(429).json({
                error: 'Gemini API quota exceeded. Please try again later or upgrade your plan.'
            });
        }

        res.status(500).json({
            error: 'Failed to generate summary',
            details: error.message
        });
    }
};

/**
 * Alternative: Generate title suggestion from content
 */
const suggestTitle = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `Generate a short, descriptive title (maximum 5-7 words) for this text:\n\n${content.substring(0, 2000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const title = response.text().trim();

        res.json({ suggestedTitle: title });

    } catch (error) {
        console.error('Title suggestion error:', error);
        res.status(500).json({ error: 'Failed to suggest title' });
    }
};

/**
 * Extract key topics/tags from content
 */
const extractTags = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `Extract 3-5 key topics or tags from this text. Return only the tags as a comma-separated list, no additional text:\n\n${content.substring(0, 2000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const tagsText = response.text();

        const tags = tagsText
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0);

        res.json({ tags });

    } catch (error) {
        console.error('Tag extraction error:', error);
        res.status(500).json({ error: 'Failed to extract tags' });
    }
};

/**
 * ✅ NEW: Analyze ALL notes and provide AI insights
 * This function analyzes all user notes and returns patterns, themes, and suggestions
 */
const analyzeAllNotes = async (req, res) => {
    try {
        const { notes } = req.body;

        if (!notes || notes.length === 0) {
            return res.status(400).json({ error: 'No notes to analyze' });
        }

        console.log(`📊 Analyzing ${notes.length} notes with Gemini AI...`);

        // Prepare notes data for AI (limit to first 20 notes to avoid token limits)
        const notesToAnalyze = notes.slice(0, 20);
        const notesSummary = notesToAnalyze.map((note, index) => {
            const title = note.title || 'Untitled';
            const content = (note.content || '').substring(0, 300);
            const tags = note.tags && note.tags.length > 0 ? `\n   Tags: ${note.tags.join(', ')}` : '';
            return `${index + 1}. Title: "${title}"\n   Content: ${content}...${tags}`;
        }).join('\n\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `You are an AI assistant analyzing a user's personal notes. Based on the following ${notesToAnalyze.length} notes, provide a helpful analysis.

Notes:
${notesSummary}

Please provide your response in the following format (use clear line breaks between sections):

🔍 **What You're Writing About**
[2-3 sentences summarizing the main topics and themes]

📊 **Key Patterns I Notice**
• Pattern 1
• Pattern 2
• Pattern 3

💡 **Insight**
[One interesting observation about their note-taking]

✨ **Suggestion**
[One friendly, actionable suggestion to help them]

Keep your response encouraging and helpful. Be specific based on their actual notes.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        console.log('✅ AI Analysis completed successfully');

        res.json({
            insight: analysis,
            notesAnalyzed: notes.length,
            provider: 'google-gemini',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI Analyze All Notes error:', error);

        if (error.message.includes('API key')) {
            return res.status(401).json({
                error: 'Invalid Gemini API key. Please check your configuration.'
            });
        }

        if (error.message.includes('quota')) {
            return res.status(429).json({
                error: 'Gemini API quota exceeded. Please try again later.'
            });
        }

        res.status(500).json({
            error: 'Failed to analyze notes',
            details: error.message
        });
    }
};

module.exports = {
    summarizeNote,
    suggestTitle,
    extractTags,
    analyzeAllNotes  // ✅ ADD THIS NEW FUNCTION
};