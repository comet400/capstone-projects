import Constants from "expo-constants";

/**
 * Auto-detect the backend URL based on the Expo dev server's host IP.
 * This removes the need to manually update the IP every time your
 * network changes.
 *
 * How it works:
 *  - Expo injects `hostUri` (e.g. "192.168.1.5:8081") when running via `expo start`.
 *  - We strip Expo's port and replace it with the backend port (5825).
 *  - Falls back to Android emulator loopback (10.0.2.2) or localhost.
 */
function getBaseUrl(): string {
  const expoHost = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
  if (expoHost) {
    const ip = expoHost.split(":")[0];
    return `http://${ip}:5825`;
  }
  // Android emulator → host machine loopback
  return "http://10.0.2.2:5825";
}

export const API_BASE_URL = getBaseUrl();