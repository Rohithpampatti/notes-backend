const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        console.log('Connection string:', process.env.MONGO_URI);

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected successfully!');

        // Test write permission
        const testSchema = new mongoose.Schema({ test: String, createdAt: { type: Date, default: Date.now } });
        const Test = mongoose.model('Test', testSchema);
        await Test.create({ test: 'Hello MongoDB' });
        console.log('✅ Can write to database!');

        // Read test
        const tests = await Test.find();
        console.log('✅ Can read from database!');

        await mongoose.disconnect();
        console.log('✅ All tests passed! MongoDB Atlas is working!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testConnection();