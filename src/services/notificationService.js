import { OneSignal } from 'react-native-onesignal';
import { storage } from '../utils/storage';

/**
 * Get OneSignal Player ID (device identifier) with retry logic
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 */
export async function getOneSignalPlayerId(maxRetries = 5, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[OneSignal] Attempt ${i + 1}/${maxRetries}: Getting Player ID...`);
      
      const playerId = await OneSignal.User.getOnesignalId();
      
      console.log(`[OneSignal] Raw response from getOnesignalId():`, JSON.stringify(playerId));
      console.log(`[OneSignal] Type of response:`, typeof playerId);
      console.log(`[OneSignal] Player ID value:`, playerId);
      
      if (playerId && typeof playerId === 'string' && playerId.length > 0) {
        console.log(`[OneSignal] ✅ Valid Player ID obtained: ${playerId}`);
        return playerId;
      }
      
      console.log(`[OneSignal] Player ID not ready yet (got: ${playerId}), waiting ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`[OneSignal] Attempt ${i + 1}/${maxRetries}: Error:`, error);
      console.error(`[OneSignal] Error stack:`, error.stack);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  console.error('[OneSignal] ❌ Failed to get Player ID after all retries');
  return null;
}

/**
 * Register device with backend (only if not already registered)
 * @param {string} playerId - OneSignal Player ID
 * @param {string} apiBaseUrl - API base URL
 * @param {boolean} forceRegister - Force registration even if already registered
 */
export async function registerDeviceToken(playerId, apiBaseUrl, forceRegister = false) {
  try {
    if (!playerId) {
      console.warn('[Register] ❌ No OneSignal Player ID available');
      return false;
    }

    // Check if this player ID has already been registered
    const registeredPlayerId = await storage.getRegisteredPlayerId();
    
    if (!forceRegister && registeredPlayerId === playerId) {
      console.log('[Register] ✅ Device already registered with this Player ID:', playerId);
      console.log('[Register] ⏭️  Skipping duplicate registration');
      return true; // Return true because device is already registered
    }

    if (registeredPlayerId && registeredPlayerId !== playerId) {
      console.log('[Register] 🔄 Player ID changed from', registeredPlayerId, 'to', playerId);
      console.log('[Register] Will register new Player ID');
    }

    const language = await storage.getLanguage() || 'english';
    const deviceInfo = {
      platform: 'android',
      timestamp: new Date().toISOString(),
    };

    const payload = {
      token: playerId,
      language,
      deviceInfo,
    };

    console.log('[Register] 📤 Sending registration to backend:');
    console.log('[Register] URL:', `${apiBaseUrl}/api/device-tokens/register`);
    console.log('[Register] Player ID (full):', playerId);
    console.log('[Register] Player ID length:', playerId.length);
    console.log('[Register] Language:', language);
    console.log('[Register] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${apiBaseUrl}/api/device-tokens/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[Register] 📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Register] Failed to register token:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('[Register] Token registration response:', result);

    if (result.success || result.message === 'Device token registered successfully') {
      console.log('[Register] ✅ Device token registered successfully with backend');
      
      // Store the registered player ID to prevent duplicate registrations
      await storage.saveRegisteredPlayerId(playerId);
      
      // Also store in legacy location for compatibility
      await storage.saveFCMToken(playerId);
      
      return true;
    } else {
      console.error('[Register] ❌ Failed to register token:', result.message || result.error);
      return false;
    }
  } catch (error) {
    console.error('[Register] ❌ Error registering device token:', error);
    return false;
  }
}

/**
 * Setup OneSignal and register device
 */
export async function setupOneSignal(apiBaseUrl) {
  try {
    console.log('Setting up OneSignal...');

    // Wait a bit for OneSignal to be fully initialized
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the player ID
    const playerId = await getOneSignalPlayerId();

    if (playerId) {
      // Register with backend
      await registerDeviceToken(playerId, apiBaseUrl);
    } else {
      console.warn('OneSignal Player ID not available yet');
    }

    return true;
  } catch (error) {
    console.error('Error setting up OneSignal:', error);
    return false;
  }
}

/**
 * Save notification to local storage from OneSignal data
 * @param {Object} notificationData - { title, body, data, notificationId }
 */
export async function saveNotificationLocally(notificationData) {
  try {
    const { title, body, data = {}, notificationId } = notificationData;
    
    console.log('[NotificationService] Saving notification:', {
      title,
      body: body?.substring(0, 50) + '...',
      notificationId,
    });
    
    const notifications = await storage.getNotifications();
    const id = notificationId || `notification_${Date.now()}_${Math.random()}`;
    
    // Check if already exists
    const exists = notifications.some(n => n.id === id);
    if (exists) {
      console.log('[NotificationService] ⚠️  Notification already exists, skipping');
      return null;
    }
    
    // Create notification object
    const newNotification = {
      id,
      type: data.type || 'news',
      title: title || 'Notification',
      message: body || '',
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        postId: data.postId || '',
        slug: data.slug || '',
        category: data.category || '',
        url: data.url || '',
        imageUrl: data.imageUrl || '',
        criticality: data.criticality || '',
        author: data.author || '',
        storyAt: data.storyAt || '',
      },
    };
    
    // Add to beginning of array (newest first)
    notifications.unshift(newNotification);
    
    // Keep only latest 100 notifications
    await storage.saveNotifications(notifications.slice(0, 100));
    
    console.log('[NotificationService] ✅ Notification saved successfully:', id);
    return newNotification;
  } catch (error) {
    console.error('[NotificationService] ❌ Error saving notification:', error);
    return null;
  }
}

/**
 * Save notification to local storage (OLD METHOD - kept for compatibility)
 */
export async function saveNotification(notification) {
  try {
    const notifications = await storage.getNotifications();
    
    const notificationId = notification.notificationId || `notification_${Date.now()}_${Math.random()}`;
    
    // Check if already exists
    const exists = notifications.some(n => n.id === notificationId);
    if (!exists) {
      const newNotification = {
        id: notificationId,
        type: notification.additionalData?.type || 'news',
        title: notification.title || 'Notification',
        message: notification.body || '',
        timestamp: new Date().toISOString(),
        read: false,
        data: notification.additionalData || {},
      };
      
      notifications.unshift(newNotification);
      await storage.saveNotifications(notifications.slice(0, 100));
      console.log('Notification saved:', newNotification.id);
      return newNotification;
    } else {
      console.log('Notification already exists');
      return null;
    }
  } catch (error) {
    console.error('Error saving notification:', error);
    return null;
  }
}

/**
 * Get all notifications from local storage
 */
export async function getNotifications() {
  try {
    return await storage.getNotifications();
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const notifications = await storage.getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      notifications[index].read = true;
      await storage.saveNotifications(notifications);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const notifications = await storage.getNotifications();
    notifications.forEach(n => n.read = true);
    await storage.saveNotifications(notifications);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  try {
    await storage.saveNotifications([]);
    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  try {
    const notifications = await getNotifications();
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Clear registered player ID (for debugging/testing)
 * Forces re-registration on next app start
 */
export async function clearRegisteredPlayerId() {
  try {
    await storage.clearRegisteredPlayerId();
    console.log('[NotificationService] Cleared registered player ID');
    return true;
  } catch (error) {
    console.error('[NotificationService] Error clearing registered player ID:', error);
    return false;
  }
}

