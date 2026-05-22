import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://jqgjgzwdfilppufnmbyz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hSYoCQSeL9CAkZcuLuN2jg_kwWIgm6o';

const memoryStore = new Map<string, string>();
const memoryStorage = {
  getItem: async (key: string) => memoryStore.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  removeItem: async (key: string) => {
    memoryStore.delete(key);
  },
};

const canUseAsyncStorage = Platform.OS !== 'web' || typeof window !== 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: canUseAsyncStorage ? AsyncStorage as any : memoryStorage,
    autoRefreshToken: canUseAsyncStorage,
    persistSession: canUseAsyncStorage,
    detectSessionInUrl: false,
  },
});
