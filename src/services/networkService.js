import NetInfo from '@react-native-community/netinfo';

/**
 * Service to monitor network connectivity
 */

let networkListeners = [];
let currentNetworkState = null;

/**
 * Get current network state
 * @returns {Promise<{isConnected: boolean, type: string, isInternetReachable: boolean}>}
 */
export const getNetworkState = async () => {
  try {
    const state = await NetInfo.fetch();
    currentNetworkState = {
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable ?? false,
    };
    return currentNetworkState;
  } catch (error) {
    console.error('[NetworkService] Error fetching network state:', error);
    return {
      isConnected: false,
      type: 'unknown',
      isInternetReachable: false,
    };
  }
};

/**
 * Check if device is connected to internet
 * @returns {Promise<boolean>}
 */
export const isConnected = async () => {
  const state = await getNetworkState();
  return state.isConnected && state.isInternetReachable;
};

/**
 * Subscribe to network state changes
 * @param {Function} callback - Callback function that receives network state
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNetworkChanges = (callback) => {
  if (typeof callback !== 'function') {
    console.warn('[NetworkService] Callback must be a function');
    return () => {};
  }

  // Add callback to listeners
  networkListeners.push(callback);

  // Get initial state
  getNetworkState().then(state => {
    callback(state);
  });

  // Subscribe to NetInfo changes
  const unsubscribe = NetInfo.addEventListener(state => {
    const networkState = {
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable ?? false,
    };
    
    currentNetworkState = networkState;
    
    // Notify all listeners
    networkListeners.forEach(listener => {
      try {
        listener(networkState);
      } catch (error) {
        console.error('[NetworkService] Error in network listener:', error);
      }
    });
  });

  // Return unsubscribe function
  return () => {
    // Remove callback from listeners
    networkListeners = networkListeners.filter(listener => listener !== callback);
    unsubscribe();
  };
};

/**
 * Get current network state (synchronous, may be null if not initialized)
 * @returns {Object|null}
 */
export const getCurrentNetworkState = () => {
  return currentNetworkState;
};

/**
 * Clear all network listeners
 */
export const clearNetworkListeners = () => {
  networkListeners = [];
};

