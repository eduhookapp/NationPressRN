/**
 * Utility to track handled notification URLs to prevent React Navigation
 * from re-processing them when users click other articles
 */

// Store the last handled notification URL
let lastHandledNotificationUrl = null;

/**
 * Mark a notification URL as handled
 * @param {string} url - The notification URL that was handled
 */
export function markNotificationUrlAsHandled(url) {
  if (url) {
    lastHandledNotificationUrl = url;
    console.log('[NotificationNavigation] Marked URL as handled:', url);
    
    // Clear after 10 seconds to allow the same notification to be handled again later
    setTimeout(() => {
      lastHandledNotificationUrl = null;
      console.log('[NotificationNavigation] Cleared handled URL');
    }, 10000);
  }
}

/**
 * Check if a URL was already handled
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL was already handled
 */
export function isNotificationUrlHandled(url) {
  if (!url) return false;
  return lastHandledNotificationUrl === url;
}

/**
 * Get the last handled notification URL
 * @returns {string|null} The last handled URL or null
 */
export function getLastHandledNotificationUrl() {
  return lastHandledNotificationUrl;
}

/**
 * Clear the handled notification URL
 */
export function clearHandledNotificationUrl() {
  lastHandledNotificationUrl = null;
  console.log('[NotificationNavigation] Cleared handled URL manually');
}

