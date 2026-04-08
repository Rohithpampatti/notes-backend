const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with SERVICE_ROLE_KEY for verification
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // ✅ Use SERVICE_ROLE_KEY, not ANON_KEY
);

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            console.error('No authorization header');
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            console.error('No token in authorization header');
            return res.status(401).json({ error: 'Invalid token format' });
        }

        console.log('Verifying token...');

        // Verify the JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            console.error('Supabase auth error:', error.message);
            return res.status(401).json({ error: error.message });
        }

        if (!user) {
            console.error('No user found for token');
            return res.status(401).json({ error: 'Invalid token' });
        }

        console.log('User authenticated:', user.email);

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            token: token
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = authMiddleware;