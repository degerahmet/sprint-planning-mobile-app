import 'react-native-url-polyfill/auto'; // Ensure this is imported first
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// Determine if running in a Node.js environment
const isNode = typeof window === 'undefined';

// Get environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate that the URL is well-formed
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Check for missing or invalid env variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase URL or Anon Key is missing. Please check your environment variables.");
}

if (!isValidUrl(SUPABASE_URL)) {
  throw new Error("Supabase URL is invalid. Ensure it starts with https:// and is properly formed.");
}

// Optional: Debug logging
if (__DEV__) {
  console.log("SUPABASE_URL:", SUPABASE_URL);
  console.log("SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "[SET]" : "[MISSING]");
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: isNode ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// AsyncStorage helpers
const loadFromStorage = async (key: string): Promise<any> => {
  try {
    const storedData = await AsyncStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error('Error loading data from AsyncStorage:', error);
    return null;
  }
};

const saveToStorage = async (key: string, data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to AsyncStorage:', error);
  }
};

// Hook for cached fetching
export const useCachedFetch = (key: string, fetchFunction: () => Promise<any>) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Load from cache
        const cachedData = await loadFromStorage(key);
        if (cachedData) {
          setData(cachedData);
        }

        // Fetch fresh data
        const freshData = await fetchFunction();
        setData(freshData);

        // Update cache
        await saveToStorage(key, freshData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, fetchFunction]);

  return { data, isLoading, error };
};

// Example table hooks
export const useEmployees = () => {
  return useCachedFetch('employees', async () => {
    const { data, error } = await supabase.from('Employees').select('*');
    if (error) throw new Error(error.message);
    return data;
  });
};

export const useSprints = () => {
  return useCachedFetch('sprints', async () => {
    const { data, error } = await supabase.from('Sprint').select('*');
    if (error) throw new Error(error.message);
    return data;
  });
};

export const useTasks = () => {
  return useCachedFetch('tasks', async () => {
    const { data, error } = await supabase.from('Tasks').select('*');
    if (error) throw new Error(error.message);
    return data;
  });
};
