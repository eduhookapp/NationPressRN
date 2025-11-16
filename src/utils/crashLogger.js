import { NativeModules } from 'react-native';

const { CrashLogger } = NativeModules;

/**
 * Crash Logger utility for React Native
 * Automatically catches JavaScript errors and logs them to file and Crashlytics
 */
class CrashLoggerUtil {
  constructor() {
    this.originalErrorHandler = null;
    this.originalUnhandledRejection = null;
    this.isInitialized = false;
  }

  /**
   * Initialize crash logging
   * Call this in your App.js or index.js
   */
  initialize() {
    if (this.isInitialized || !CrashLogger) {
      return;
    }

    // Save original handlers
    this.originalErrorHandler = ErrorUtils.getGlobalHandler();
    this.originalUnhandledRejection = global.onunhandledrejection;

    // Set up global error handler
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      const errorMessage = error.message || 'Unknown error';
      const stackTrace = error.stack || 'No stack trace available';
      
      console.error('Global error caught:', errorMessage, stackTrace);
      
      // Log to native crash logger
      if (CrashLogger) {
        CrashLogger.logError(errorMessage, stackTrace)
          .then(() => {})
          .catch((err) => console.error('Failed to log error:', err));
      }

      // Call original handler
      if (this.originalErrorHandler) {
        this.originalErrorHandler(error, isFatal);
      }
    });

    // Handle unhandled promise rejections
    global.onunhandledrejection = (event) => {
      const reason = event.reason || 'Unknown rejection';
      const errorMessage = typeof reason === 'string' ? reason : (reason.message || 'Unhandled promise rejection');
      const stackTrace = reason.stack || 'No stack trace available';
      
      console.error('Unhandled promise rejection:', errorMessage, stackTrace);
      
      if (CrashLogger) {
        CrashLogger.logError(`Unhandled Promise Rejection: ${errorMessage}`, stackTrace)
          .then(() => {})
          .catch((err) => console.error('Failed to log rejection:', err));
      }

      if (this.originalUnhandledRejection) {
        this.originalUnhandledRejection(event);
      }
    };

    this.isInitialized = true;
    // Make crashLogger available globally for WebView error handlers
    global.crashLogger = this;
    console.log('Crash logger initialized');
  }

  /**
   * Log a custom message
   */
  logMessage(message, level = 'INFO') {
    if (CrashLogger) {
      CrashLogger.logMessage(message, level)
        .then(() => {})
        .catch((err) => console.error('Failed to log message:', err));
    }
  }

  /**
   * Log an error manually
   */
  logError(error, additionalInfo = '') {
    const errorMessage = error.message || 'Unknown error';
    const stackTrace = error.stack || 'No stack trace available';
    const fullMessage = additionalInfo ? `${additionalInfo}\n${errorMessage}` : errorMessage;
    
    if (CrashLogger) {
      CrashLogger.logError(fullMessage, stackTrace)
        .then(() => {})
        .catch((err) => console.error('Failed to log error:', err));
    }
  }

  /**
   * Set a custom key in Crashlytics
   */
  setCustomKey(key, value) {
    if (CrashLogger) {
      CrashLogger.setCustomKey(key, String(value))
        .then(() => {})
        .catch((err) => console.error('Failed to set custom key:', err));
    }
  }

  /**
   * Get the log directory path (for debugging)
   */
  async getLogDirectoryPath() {
    if (CrashLogger) {
      try {
        return await CrashLogger.getLogDirectoryPath();
      } catch (err) {
        console.error('Failed to get log directory path:', err);
        return null;
      }
    }
    return null;
  }

  /**
   * Test crash (for testing purposes only)
   */
  testCrash() {
    if (CrashLogger) {
      CrashLogger.testCrash()
        .then(() => {})
        .catch((err) => console.error('Test crash failed:', err));
    }
  }
}

// Export singleton instance
export default new CrashLoggerUtil();

