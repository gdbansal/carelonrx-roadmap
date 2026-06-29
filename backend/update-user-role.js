const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://carelonrx-admin:CarelonRx2026!@carelonrx.xjukmgv.mongodb.net/carelonrx-roadmap?retryWrites=true&w=majority&appName=carelonrx';

// Simple User schema
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

async function updateUserRole() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // List all users first
        console.log('📋 All users in database:');
        const allUsers = await User.find({}, 'username name email role');
        allUsers.forEach(u => {
            console.log(`   - ${u.username} | ${u.name} | ${u.email} | Role: ${u.role}`);
        });
        console.log();

        // Find the user by username
        const username = 'gagandeep.bansal';
        let user = await User.findOne({ username });

        if (!user) {
            console.log(`❌ User '${username}' not found by username`);
            
            // Try to find by email
            console.log('� Trying to find by email...');
            user = await User.findOne({ email: /gagandeep\.bansal/i });
            
            if (!user) {
                console.log('❌ User not found by email either');
                console.log('\n💡 Please check the exact username in the list above');
                return;
            } else {
                console.log(`✅ Found user by email: ${user.username}`);
            }
        }

        console.log(`\n📊 Current user details:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Current Role: ${user.role}`);
        console.log();

        if (user.role === 'admin') {
            console.log('✅ User already has admin role!');
        } else {
            console.log(`🔄 Updating role from '${user.role}' to 'admin'...`);
            
            // Use direct MongoDB update
            const result = await User.collection.updateOne(
                { _id: user._id },
                { $set: { role: 'admin' } }
            );
            
            console.log(`📝 Update result: ${result.modifiedCount} document(s) modified`);
            
            // Verify the update by fetching fresh from DB
            const updatedUser = await User.findById(user._id);
            console.log(`\n✅ Verified - New role: ${updatedUser.role}`);
            
            if (updatedUser.role === 'admin') {
                console.log('🎉 SUCCESS! Role updated to admin!');
            } else {
                console.log('⚠️  WARNING: Role may not have updated correctly');
            }
        }

        console.log('\n🎉 User now has admin privileges!');
        console.log('   Can access:');
        console.log('   - Admin Panel');
        console.log('   - User Management');
        console.log('   - All Initiatives (view/edit/delete)');
        console.log('   - System Settings');
        console.log('\n💡 User needs to logout and login again to see changes\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the update
console.log('🚀 Starting user role update...\n');
updateUserRole();
