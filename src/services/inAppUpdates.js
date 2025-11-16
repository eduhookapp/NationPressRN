import { Platform } from 'react-native';

// Conditionally import to prevent crashes if native module isn't linked
let SpInAppUpdates = null;
let IAUUpdateKind = null;
let IAUInstallStatus = null;

try {
  const inAppUpdatesModule = require('sp-react-native-in-app-updates');
  SpInAppUpdates = inAppUpdatesModule.default || inAppUpdatesModule;
  IAUUpdateKind = inAppUpdatesModule.IAUUpdateKind;
  IAUInstallStatus = inAppUpdatesModule.IAUInstallStatus;
} catch (error) {
  console.warn('[InAppUpdates] Native module not available:', error.message);
}

/**
 * Check for app updates and prompt user to update if available
 * This works for both Android (Google Play) and iOS (App Store)
 */
export const checkForUpdate = async () => {
  try {
    // Check if native module is available
    if (!SpInAppUpdates || !IAUUpdateKind || !IAUInstallStatus) {
      console.log('[InAppUpdates] Native module not available, skipping update check');
      return;
    }
    
    console.log('[InAppUpdates] Checking for app updates...');
    
    // Safely instantiate the module
    let inAppUpdates;
    try {
      inAppUpdates = new SpInAppUpdates(false); // false = not in debug mode
    } catch (instantiationError) {
      console.error('[InAppUpdates] Error instantiating module:', instantiationError);
      return; // Exit if we can't create the instance
    }
    
    // Check if update is needed
    let result;
    try {
      result = await inAppUpdates.checkNeedsUpdate();
    } catch (checkError) {
      console.error('[InAppUpdates] Error checking for updates:', checkError);
      return; // Exit if check fails
    }
    
    console.log('[InAppUpdates] Update check result:', result);
    
    if (result.shouldUpdate) {
      console.log('[InAppUpdates] Update available, preparing update options...');
      
      let updateOptions = {};
      
      if (Platform.OS === 'android') {
        // Android: Use immediate update (user must update before continuing)
        updateOptions = {
          updateType: IAUUpdateKind.IMMEDIATE,
        };
        console.log('[InAppUpdates] Android immediate update configured');
      } else if (Platform.OS === 'ios') {
        // iOS: Show custom alert to redirect to App Store
        updateOptions = {
          title: 'Update Available',
          message: 'A new version of the app is available on the App Store. Would you like to update now?',
          buttonUpgradeText: 'Update',
          buttonCancelText: 'Cancel',
        };
        console.log('[InAppUpdates] iOS update alert configured');
      }
      
      // Set up status listener for Android (to handle download completion)
      if (Platform.OS === 'android') {
        const statusListener = (downloadStatus) => {
          console.log('[InAppUpdates] Download status:', downloadStatus);
          
          if (downloadStatus.status === IAUInstallStatus.DOWNLOADED) {
            console.log('[InAppUpdates] Update downloaded, installing...');
            try {
              inAppUpdates.installUpdate();
              // Remove listener after installation
              inAppUpdates.removeStatusUpdateListener(statusListener);
            } catch (installError) {
              console.error('[InAppUpdates] Error installing update:', installError);
            }
          }
        };
        
        inAppUpdates.addStatusUpdateListener(statusListener);
      }
      
      // Start the update process
      console.log('[InAppUpdates] Starting update process...');
      await inAppUpdates.startUpdate(updateOptions);
      
      console.log('[InAppUpdates] Update process started successfully');
    } else {
      console.log('[InAppUpdates] App is up to date');
    }
  } catch (error) {
    console.error('[InAppUpdates] Error checking for updates:', error);
    // Don't throw - we don't want update errors to crash the app
  }
};

