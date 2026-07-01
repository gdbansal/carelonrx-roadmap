# Security Implementation

## Overview

The CarelonRx Roadmap application implements encryption for sensitive user data stored in MongoDB to ensure data security and privacy.

## Encryption Details

### Password Encryption

**Method**: bcrypt hashing with salt
**Library**: bcryptjs v2.4.3
**Salt Rounds**: 10

**How it works:**
1. When a user signs up or changes their password, the plain text password is hashed using bcrypt
2. The hash is generated with a salt (random data) to ensure unique hashes even for identical passwords
3. Only the hash is stored in MongoDB - the original password is never saved
4. During login, the provided password is compared against the stored hash using bcrypt's compare function
5. Passwords are automatically hashed via Mongoose pre-save hook

**Implementation:**
```javascript
// Password is hashed before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Password comparison for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
```

### Email Encryption

**Method**: AES-256-CBC symmetric encryption
**Library**: Node.js built-in crypto module
**Key Derivation**: scrypt with salt

**How it works:**
1. Email addresses are encrypted before being stored in MongoDB
2. Encryption uses AES-256-CBC algorithm with a randomly generated IV (Initialization Vector)
3. The encryption key is derived from a secret key using scrypt
4. Encrypted format: `IV:EncryptedData` (both in hexadecimal)
5. Emails are automatically encrypted/decrypted via Mongoose getters and setters

**Implementation:**
```javascript
// Email encryption on save
email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    set: encryptEmail,    // Encrypts before saving
    get: decryptEmail     // Decrypts when retrieving
}
```

**Encryption Key:**
- Default: `carelonrx-secure-key-2026-change-in-prod`
- **IMPORTANT**: Change this in production via environment variable `ENCRYPTION_KEY`

## Security Best Practices

### For Production Deployment

1. **Set Custom Encryption Key:**
   ```bash
   export ENCRYPTION_KEY="your-secure-random-key-here"
   ```
   - Use a strong, random key (at least 32 characters)
   - Never commit the key to version control
   - Store in environment variables or secure key management service

2. **MongoDB Connection:**
   - Use MongoDB Atlas with encryption at rest
   - Enable network encryption (TLS/SSL)
   - Restrict IP access to known servers only

3. **HTTPS Only:**
   - Always use HTTPS in production
   - Never transmit sensitive data over HTTP

4. **Token Security:**
   - JWT tokens expire after 24 hours
   - Tokens are signed with a secret key
   - Store tokens securely on client side

5. **Session Management:**
   - 30-minute inactivity timeout
   - Automatic logout on session expiry
   - Activity tracking to reset timer

## Data Protection

### What is Encrypted:
- ✅ **Passwords**: Hashed with bcrypt (one-way, cannot be decrypted)
- ✅ **Email addresses**: Encrypted with AES-256-CBC (reversible with key)

### What is NOT Encrypted:
- ❌ Username (used for login, needs to be searchable)
- ❌ Name (display purposes)
- ❌ Role (access control)
- ❌ Profile images (Base64 encoded but not encrypted)
- ❌ Initiative data (business data, not PII)

## Compliance

This implementation helps meet:
- **GDPR**: Personal data protection requirements
- **HIPAA**: If handling healthcare-related data
- **SOC 2**: Security controls for data protection
- **ISO 27001**: Information security management

## Migration Notes

### Existing Users

If you have existing users in the database with plain text passwords:

1. **Password Migration:**
   - Existing plain text passwords will be hashed on next login
   - Users should change their passwords after encryption is enabled
   - Consider forcing password reset for all users

2. **Email Migration:**
   - Existing plain text emails will be encrypted on next user update
   - Emails are automatically encrypted when user profile is saved
   - No action required from users

### Testing Encryption

To verify encryption is working:

1. **Check MongoDB:**
   ```javascript
   // Passwords should look like:
   "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP"
   
   // Emails should look like:
   "a1b2c3d4e5f6....:1234567890abcdef...."
   ```

2. **Test Login:**
   - Create a new user
   - Verify login works with correct password
   - Verify login fails with incorrect password

3. **Test Email Retrieval:**
   - View user profile
   - Email should display correctly (decrypted)
   - Check MongoDB - email should be encrypted

## Troubleshooting

### Login Issues After Encryption

**Problem**: Users cannot login after encryption is enabled

**Solution**:
1. Check if bcryptjs is installed: `npm list bcryptjs`
2. Verify password is being hashed in pre-save hook
3. Check login endpoint is using `comparePassword` method
4. Clear any cached data

### Email Display Issues

**Problem**: Emails showing as encrypted strings

**Solution**:
1. Verify Mongoose schema has getters enabled: `toJSON: { getters: true }`
2. Check encryption key is consistent
3. Ensure `decryptEmail` function is working

### Performance Concerns

**Note**: Bcrypt is intentionally slow (security feature)
- Login may take 100-200ms per request
- This is normal and expected
- Do not reduce salt rounds to improve performance

## Security Audit

Last Updated: June 29, 2026
Next Review: December 2026

### Recommendations:
1. ✅ Implement password hashing - COMPLETED
2. ✅ Implement email encryption - COMPLETED
3. ✅ Add session timeout - COMPLETED
4. ⏳ Add rate limiting for login attempts - PENDING
5. ⏳ Implement 2FA (Two-Factor Authentication) - FUTURE
6. ⏳ Add audit logging for sensitive operations - FUTURE

## Contact

For security concerns or questions, contact the development team.

**Never share:**
- Encryption keys
- Database credentials
- JWT secrets
- User passwords
