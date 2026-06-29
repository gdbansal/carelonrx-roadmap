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

        // Find the user
        const username = 'gagandeep.bansal';
        const user = await User.findOne({ username });

        if (!user) {
            console.log(`❌ User '${username}' not found in database`);
            console.log('\n📋 Available users:');
            const allUsers = await User.find({}, 'username name role');
            allUsers.forEach(u => {
                console.log(`   - ${u.username} (${u.name}) - Role: ${u.role}`);
            });
            return;
        }

        console.log(`📊 Current user details:`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Current Role: ${user.role}`);
        console.log();

        if (user.role === 'admin') {
            console.log('✅ User already has admin role!');
        } else {
            console.log(`🔄 Updating role from '${user.role}' to 'admin'...`);
            
            await User.updateOne(
                { _id: user._id },
                { $set: { role: 'admin' } }
            );
            
            console.log('✅ Role updated successfully!');
            
            // Verify the update
            const updatedUser = await User.findOne({ username });
            console.log(`\n✅ Verified - New role: ${updatedUser.role}`);
        }

        console.log('\n🎉 User now has admin privileges!');
        console.log('   Can access:');
        console.log('   - Admin Panel');
        console.log('   - User Management');
        console.log('   - All Initiatives (view/edit/delete)');
        console.log('   - System Settings\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the update
console.log('🚀 Starting user role update...\n');
updateUserRole();
