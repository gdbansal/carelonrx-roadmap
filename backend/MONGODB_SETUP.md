# MongoDB Setup Instructions

## Step 1: Create MongoDB Atlas Account (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a New Cluster

1. After logging in, click **"Build a Database"**
2. Select **"M0 FREE"** tier (512MB storage, perfect for this app)
3. Choose a cloud provider and region (closest to your users)
4. Click **"Create Cluster"** (takes 3-5 minutes)

## Step 3: Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `carelonrx-admin` (or any username you prefer)
5. Password: Generate a secure password (save it!)
6. Database User Privileges: **"Atlas admin"**
7. Click **"Add User"**

## Step 4: Whitelist IP Addresses

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is needed for Render.com deployment
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go back to **"Database"** (Clusters)
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Driver: **Node.js**
5. Version: **4.1 or later**
6. Copy the connection string, it looks like:
   ```
   mongodb+srv://carelonrx-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual database user password
8. Add database name before the `?`:
   ```
   mongodb+srv://carelonrx-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/carelonrx-roadmap?retryWrites=true&w=majority
   ```

## Step 6: Add to Render Environment Variables

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service: **carelonrx-roadmap**
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add:
   - Key: `MONGODB_URI`
   - Value: Your full connection string from Step 5
6. Click **"Save Changes"**
7. Render will automatically redeploy with the new environment variable

## Step 7: Verify Connection

1. After deployment completes, check the logs in Render
2. You should see:
   ```
   ✅ MongoDB Connected Successfully
   📊 Database: carelonrx-roadmap
   📝 Initializing default admin user...
   ✅ Default admin user created
   ```

## Default Admin Credentials

After MongoDB is connected, the system will automatically create:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@carelon.com`
- **Role**: `admin`

## Testing

1. Log in to the frontend with admin credentials
2. Create a test initiative
3. Refresh the page - data should persist!
4. Check MongoDB Atlas:
   - Go to **"Browse Collections"**
   - You should see `users` and `initiatives` collections

## Troubleshooting

### Connection Failed
- Check that IP whitelist includes 0.0.0.0/0
- Verify password has no special characters that need URL encoding
- Ensure connection string includes database name

### Data Not Persisting
- Check Render logs for MongoDB connection errors
- Verify MONGODB_URI environment variable is set correctly
- Restart the Render service

### Cannot Create Admin User
- Check if user already exists in MongoDB Atlas
- Verify database user has write permissions

## MongoDB Atlas Dashboard

Access your data at: https://cloud.mongodb.com
- View collections
- Run queries
- Monitor performance
- Create backups

## Cost

- **Free Tier (M0)**: 512MB storage, shared RAM
- **Perfect for**: Development, small production apps
- **Upgrade**: If you need more storage/performance later

## Security Best Practices

1. ✅ Use strong passwords
2. ✅ Rotate passwords regularly
3. ✅ Monitor access logs
4. ✅ Enable backup (paid feature)
5. ✅ Use environment variables (never commit credentials)

---

**Need Help?**
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Mongoose Docs: https://mongoosejs.com/docs/
