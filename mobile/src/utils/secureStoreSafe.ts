import * as SecureStore from 'expo-secure-store';

// Safe wrappers around SecureStore to prevent invalid value errors
export async function setItemSafe(key: string, value: any) {
  if (value === undefined || value === null) {
    throw new Error(`SecureStore: refusing to store null/undefined for key '${key}'`);
  }
  if (typeof value !== 'string') {
    try {
      value = JSON.stringify(value);
    } catch (e) {
      throw new Error(`SecureStore: value for key '${key}' not stringifiable`);
    }
  }
  if (value.length === 0) {
    throw new Error(`SecureStore: refusing to store empty string for key '${key}'`);
  }
  if (value.length > 5000) {
    console.warn(`SecureStore: value for key '${key}' is unusually large (${value.length} chars)`);
  }
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItemSafe(key: string) {
  try { await SecureStore.deleteItemAsync(key); } catch {}
}

export async function getItemSafe(key: string) {
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}
