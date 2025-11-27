import NetInfo from '@react-native-community/netinfo';

/**
 * Service to monitor network connectivity
 */

let networkListeners = [];
let currentNetworkState = null;

const notifyNetworkListeners = (networkState) => {
  networkListeners.forEach(listener => {
    try {
      listener(networkState);
    } catch (error) {
      console.error('[NetworkService] Error in network listener:', error);
    }
  });
};

/**
 * Get current network state
 * @returns {Promise<{isConnected: boolean, type: string, isInternetReachable: boolean}>}
 */
const buildNetworkState = (state) => {
  const isConnected = state.isConnected ?? false;
  
  // On iOS isInternetReachable can be null while NetInfo resolves reachability.
  // Treat "unknown" as connected when the transport itself is connected so we
  // don't incorrectly block the UI.
  const isInternetReachable = 
    typeof state.isInternetReachable === 'boolean'
      ? state.isInternetReachable
      : isConnected;

  return {
    isConnected,
    type: state.type,
    isInternetReachable,
  };
};

export const getNetworkState = async () => {
  try {
    const state = await NetInfo.fetch();
    currentNetworkState = buildNetworkState(state);
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
    const networkState = buildNetworkState(state);
    currentNetworkState = networkState;
    notifyNetworkListeners(networkState);
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

/**
 * Force refresh network state and notify listeners immediately.
 * Useful for manual retry buttons.
 */
export const refreshNetworkState = async () => {
  const state = await getNetworkState();
  notifyNetworkListeners(state);
  return state;
};

