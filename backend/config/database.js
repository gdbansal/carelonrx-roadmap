const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carelonrx-roadmap';
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        // Don't exit process, allow app to run with fallback
        console.log('⚠️  Running without database connection');
    }
};

module.exports = connectDB;
