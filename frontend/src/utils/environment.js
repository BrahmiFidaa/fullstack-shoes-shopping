import { Platform } from 'react-native';
import Constants from 'expo-constants';

const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]'
]);

const PRIVATE_PREFIXES = ['127.', '192.168.', '10.'];

const isPrivate172Range = (host) => {
  if (!host?.startsWith('172.')) {
    return false;
  }
  const parts = host.split('.');
  if (parts.length < 2) {
    return false;
  }
  const secondOctet = Number(parts[1]);
  return secondOctet >= 16 && secondOctet <= 31;
};

const normalizeHost = (host) => {
  if (!host) {
    return null;
  }
  return host
    .replace(/^https?:\/\//, '')
    .replace(/^exp:\/\//, '')
    .split(':')[0]
    .trim()
    .toLowerCase();
};

const isLocalHost = (host) => {
  if (!host) {
    return false;
  }
  if (LOCAL_HOSTNAMES.has(host)) {
    return true;
  }
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') {
    return true;
  }
  if (PRIVATE_PREFIXES.some((prefix) => host.startsWith(prefix))) {
    return true;
  }
  return isPrivate172Range(host);
};

const getWebHost = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.location?.hostname || null;
};

const getNativeHost = () => {
  const candidates = [
    Constants?.expoGoConfig?.debuggerHost,
    Constants?.expoGoConfig?.packagerConnectionSettings?.url,
    Constants?.expoConfig?.hostUri,
    Constants?.manifest2?.extra?.expoClientHost,
    Constants?.manifest2?.extra?.expoGo?.developer?.host,
    Constants?.manifest?.hostUri,
    Constants?.manifest?.debuggerHost
  ];

  for (const candidate of candidates) {
    const normalized = normalizeHost(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const getCurrentHost = () => {
  return Platform.OS === 'web' ? normalizeHost(getWebHost()) : getNativeHost();
};

export const isLocalAdminEnvironment = () => {
  return isLocalHost(getCurrentHost());
};
