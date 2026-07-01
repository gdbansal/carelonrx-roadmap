# Password Migration Guide

## Issue

After implementing bcrypt password hashing, existing users with plain text passwords in the database cannot login because the system now expects hashed passwords.

## Solution

Run the password migration script to hash all existing plain text passwords.

## Steps to Migrate

### Option 1: Run Migration Script (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Run the migration script:**
   ```bash
   npm run migrate-passwords
   ```

4. **Expected output:**
   ```
   🚀 Starting password migration...
   
   🔄 Connecting to MongoDB...
   ✅ Connected to MongoDB
   
   📊 Found 5 users to check
   
   🔐 Hashing password for user: admin
      ✅ Password hashed for admin
   🔐 Hashing password for user: john.doe
      ✅ Password hashed for john.doe
   ⏭️  Skipping jane.smith (already hashed)
   
   ✅ Migration complete!
      📊 Total users: 5
      🔐 Passwords hashed: 2
      ⏭️  Already hashed: 3
   
   🔍 Verifying admin user...
   ✅ Admin password verification successful!
   
   🔌 Database connection closed
   ```

5. **Test login:**
   - Try logging in with username: `admin` and password: `admin123`
   - Should work now! ✅

### Option 2: Manual Password Reset via MongoDB

If you have access to MongoDB directly:

1. **Connect to MongoDB Atlas or your MongoDB instance**

2. **Run this command to hash the admin password:**
   ```javascript
   // In MongoDB shell or Compass
   const bcrypt = require('bcryptjs');
   const salt = bcrypt.genSaltSync(10);
   const hash = bcrypt.hashSync('admin123', salt);
   
   db.users.updateOne(
     { username: 'admin' },
     { $set: { password: hash } }
   );
   ```

### Option 3: Create New Admin User

If migration doesn't work, create a new admin user:

1. **Delete old admin user** (via MongoDB or admin panel)

2. **Create new admin user via API:**
   ```bash
   curl -X POST http://localhost:3000/api/signup \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "admin123",
       "name": "Administrator",
       "email": "admin@carelon.com",
       "role": "admin"
     }'
   ```

   Note: You'll need to manually set the role to 'admin' in MongoDB after creation since signup doesn't allow admin role.

## What the Migration Script Does

1. **Connects to MongoDB** using the connection string from environment variables
2. **Finds all users** in the database
3. **Checks each password:**
   - If password starts with `$2` → Already hashed, skip
   - If password is plain text → Hash it with bcrypt
4. **Updates the database** with hashed passwords
5. **Verifies admin user** by testing the password
6. **Reports results** showing how many passwords were migrated

## Verification

After running the migration:

1. **Check MongoDB:**
   - Passwords should look like: `$2a$10$abcdefghijklmnopqrstuvwxyz...`
   - Not like: `admin123` or plain text

2. **Test login:**
   - Go to login page
   - Enter username: `admin`
   - Enter password: `admin123`
   - Should successfully login ✅

3. **Test other users:**
   - All existing users should be able to login with their original passwords
   - Passwords are hashed but login still works the same way

## Troubleshooting

### Migration Script Fails to Connect

**Error:** `Error: connect ECONNREFUSED`

**Solution:**
- Check MongoDB connection string in `.env` file
- Verify MongoDB Atlas is accessible
- Check network/firewall settings

### Admin Login Still Fails

**Error:** "Invalid username or password"

**Possible causes:**
1. Migration didn't run successfully
2. Password was changed
3. Username is incorrect

**Solution:**
1. Check MongoDB - verify password is hashed
2. Try running migration again
3. Create new admin user (Option 3 above)

### "bcryptjs not found" Error

**Error:** `Cannot find module 'bcryptjs'`

**Solution:**
```bash
cd backend
npm install bcryptjs
npm run migrate-passwords
```

## Important Notes

⚠️ **Before Running Migration:**
- Backup your database (recommended)
- Test in development environment first
- Inform users about potential downtime

✅ **After Running Migration:**
- All users can login with their existing passwords
- Passwords are now securely hashed
- No user action required
- System is more secure

🔒 **Security:**
- Migration script only hashes passwords that aren't already hashed
- Safe to run multiple times (idempotent)
- Original passwords are replaced with hashes
- Cannot reverse the process (hashing is one-way)

## For Production Deployment

When deploying to Render.com or other platforms:

1. **Run migration after deployment:**
   ```bash
   # SSH into your server or use Render shell
   cd backend
   npm run migrate-passwords
   ```

2. **Or run as a one-time job:**
   - Create a one-time job in Render
   - Command: `npm run migrate-passwords`
   - Run once after encryption deployment

3. **Verify:**
   - Test admin login
   - Test regular user login
   - Check MongoDB for hashed passwords

## Contact

If you continue to have login issues after migration, contact the development team.
