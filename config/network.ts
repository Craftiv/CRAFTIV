// Network configuration for different environments
export const NETWORK_CONFIG = {
  // For Android Emulator
  ANDROID_EMULATOR: 'http://10.0.2.2:8080',
  
  // For iOS Simulator (if backend is on same machine)
  IOS_SIMULATOR: 'http://localhost:8080',
  
  // For physical devices - replace with your computer's IP address
  PHYSICAL_DEVICE: 'http://192.168.1.100:8080', // Change this to your computer's IP
  
  // Current active configuration
  CURRENT: 'http://10.0.2.2:8080' // Default to Android emulator
};

export const getBackendUrl = () => {
  return NETWORK_CONFIG.CURRENT;
}; 