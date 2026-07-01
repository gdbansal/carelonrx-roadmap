const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://carelonrx-admin:CarelonRx2026!@carelonrx.xjukmgv.mongodb.net/carelonrx-roadmap?retryWrites=true&w=majority&appName=carelonrx';

// Simple User schema (without the pre-save hook)
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    email: String,
    role: String,
    profileImage: String,
    createdAt: Date,
    lastLogin: Date
});

const User = mongoose.model('User', userSchema);

async function migratePasswords() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all users
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users to check\n`);

        let migratedCount = 0;

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
            if (user.password && !user.password.startsWith('$2')) {
                console.log(`🔐 Hashing password for user: ${user.username}`);
                
                // Hash the plain text password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                
                // Update the user with hashed password
                await User.updateOne(
                    { _id: user._id },
                    { $set: { password: hashedPassword } }
                );
                
                console.log(`   ✅ Password hashed for ${user.username}`);
                migratedCount++;
            } else {
                console.log(`⏭️  Skipping ${user.username} (already hashed)`);
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`   📊 Total users: ${users.length}`);
        console.log(`   🔐 Passwords hashed: ${migratedCount}`);
        console.log(`   ⏭️  Already hashed: ${users.length - migratedCount}\n`);

        // Verify admin user
        const adminUser = await User.findOne({ username: 'admin' });
        if (adminUser) {
            console.log('🔍 Verifying admin user...');
            const isValid = await bcrypt.compare('admin123', adminUser.password);
            if (isValid) {
                console.log('✅ Admin password verification successful!\n');
            } else {
                console.log('❌ Admin password verification failed!\n');
            }
        }

    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run migration
console.log('🚀 Starting password migration...\n');
migratePasswords();
