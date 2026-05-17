/**
 * Request Logger Middleware
 * Logs details about each incoming request
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capture original send function
  const originalSend = res.send;

  // Override send to log response details
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log request details
    const logLevel = statusCode >= 400 ? '❌' : statusCode >= 300 ? '↩️' : '✅';
    console.log(
      `${logLevel} [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`
    );

    // Log additional details for errors
    if (statusCode >= 400) {
      console.log(`   User: ${req.user?.userId || 'Anonymous'} | IP: ${req.ip}`);
    }

    // Call the original send function
    return originalSend.call(this, data);
  };

  next();
};
