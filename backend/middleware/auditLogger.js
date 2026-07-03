const AuditLog = require('../models/AuditLog');

/**
 * Helper function to get client IP address correctly
 */
function getClientIp(req) {
    if (!req) return 'unknown';
    
    // Check X-Forwarded-For header first (for proxies/load balancers)
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        // X-Forwarded-For can contain multiple IPs, get the first one (client IP)
        return forwarded.split(',')[0].trim();
    }
    
    // Fallback to other headers and connection
    return req.headers?.['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
}

/**
 * Log an audit event to the database
 * @param {string} eventType - Type of event (e.g., 'SESSION_CREATED')
 * @param {string} userId - User identifier (e.g., 'John_PO')
 * @param {string} sessionId - Session ID (optional)
 * @param {object} details - Additional event details
 * @param {object} req - Express request object (for IP and user agent)
 */
async function logAuditEvent(eventType, userId, sessionId, details, req) {
    try {
        const auditEntry = {
            event_type: eventType,
            user_id: userId,
            session_id: sessionId || null,
            ip_address: getClientIp(req),
            user_agent: req?.headers?.['user-agent'] || 'unknown',
            details: details || {}
        };

        await AuditLog.create(auditEntry);
        console.log(`✅ Audit log created: ${eventType} by ${userId}`);
    } catch (error) {
        // Don't fail the main operation if audit logging fails
        console.error('❌ Audit logging error:', error.message);
    }
}

/**
 * Express middleware to automatically log requests
 */
function auditMiddleware(eventType) {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;
        
        // Override send function to log after successful response
        res.send = function(data) {
            // Only log successful responses (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.body?.user?.name || req.body?.createdBy || 'system';
                const sessionId = req.params?.sessionId || req.body?.sessionId || null;
                const details = {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode
                };
                
                // Log asynchronously without blocking response
                logAuditEvent(eventType, userId, sessionId, details, req).catch(err => {
                    console.error('Audit middleware error:', err);
                });
            }
            
            // Call original send
            return originalSend.call(this, data);
        };
        
        next();
    };
}

module.exports = { 
    logAuditEvent,
    auditMiddleware
};
