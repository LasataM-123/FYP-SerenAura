import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import { API_URL } from "@/config";

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.exp * 1000; // milliseconds
  } catch {
    return null;
  }
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: "patient" | "counselor" | null;
  name: string | null;
  isLoggedIn: boolean;
  otpToken: string | null;
  otpExpiry: number | null;
  hasCompletedOnboarding: boolean;
  refreshInterval?: NodeJS.Timeout;
  isTokenReady: boolean;

  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    name: string;
    role: "patient" | "counselor";
  }) => void;

  setOtpToken: (otpToken: string | null) => void;
  clearOtp: () => void;
  isOtpExpired: () => boolean;

  updateToken: (token: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  loggedIn: () => void;

  setTokenReady: (state: boolean) => void;
  startAutoRefresh: () => void;
  initAuth: () => Promise<void>; // New async initializer
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      role: null,
      name: null,
      isLoggedIn: false,
      otpToken: null,
      otpExpiry: null,
      hasCompletedOnboarding: false,
      refreshInterval: undefined,
      isTokenReady: false,

      setAuth: ({ accessToken, refreshToken, name, userId, role }) => {
        set({ 
          accessToken, 
          refreshToken, 
          name, 
          userId, 
          role,
          isTokenReady: true 
        });
        get().startAutoRefresh();
      },

      setOtpToken: (otpToken) => {
        const expiry = otpToken ? getTokenExpiry(otpToken) : null;
        set({ otpToken, otpExpiry: expiry });
      },

      clearOtp: () => set({ otpToken: null, otpExpiry: null }),

      isOtpExpired: () => {
        const { otpExpiry } = get();
        if (!otpExpiry) return true;
        return Date.now() > otpExpiry;
      },

      updateToken: (accessToken) => set({ accessToken }),

      setTokenReady: (state: boolean) => set({ isTokenReady: state }),

      logout: () => {
        const { refreshInterval } = get();
        if (refreshInterval) clearInterval(refreshInterval);

        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          role: null,
          name: null,
          isLoggedIn: false,
          otpToken: null,
          otpExpiry: null,
          hasCompletedOnboarding: false,
          refreshInterval: undefined,
          isTokenReady: true // Prevent app from hanging if logged out
        });
      },

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      loggedIn: () => set({ isLoggedIn: true }),

      // --- NEW INITIALIZATION LOGIC ---
      initAuth: async () => {
        const { accessToken, refreshToken, logout, updateToken, startAutoRefresh } = get();
        const now = Date.now();

        // 1. If refresh token is missing or dead, logout immediately
        if (!refreshToken || !getTokenExpiry(refreshToken) || now > getTokenExpiry(refreshToken)!) {
          logout();
          set({ isTokenReady: true });
          return;
        }

        // 2. If access token is missing or expired, we MUST wait to refresh it BEFORE letting the app load
        if (!accessToken || !getTokenExpiry(accessToken) || now > getTokenExpiry(accessToken)!) {
          try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });

            if (res.ok) {
              const data = await res.json();
              updateToken(data.accessToken); // Save the fresh token!
            } else {
              logout();
              set({ isTokenReady: true });
              return;
            }
          } catch (error) {
            console.error("Initial refresh failed", error);
            logout();
            set({ isTokenReady: true });
            return;
          }
        }

        // 3. We have a valid access token. Start the background timer for future refreshes.
        startAutoRefresh();

        // 4. FINALLY, unlock the app! The music provider and API calls are now safe to run.
        set({ isTokenReady: true });
      },

      startAutoRefresh: () => {
        const { refreshInterval } = get();
        if (refreshInterval) clearInterval(refreshInterval);

        const interval = setInterval(async () => {
          const { accessToken, refreshToken, updateToken, logout } = get();

          // Ensure tokens exist
          if (!accessToken || !refreshToken) {
            logout();
            return;
          }

          const now = Date.now();
          const accessExpiry = getTokenExpiry(accessToken);
          const refreshExpiry = getTokenExpiry(refreshToken);

          // Refresh token expired → logout
          if (!refreshExpiry || now > refreshExpiry) {
            logout();
            return;
          }

          // Access token expired or about to expire (within 2 mins) → refresh it
          if (!accessExpiry || accessExpiry - now < 2 * 60 * 1000) {
            try {
              const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
              });

              if (res.ok) {
                const data = await res.json();
                updateToken(data.accessToken);
              } else {
                logout();
              }
            } catch (error) {
              console.error("Auto-refresh failed", error);
              logout();
            }
          }
        }, 60 * 1000); // every 1 min

        set({ refreshInterval: interval });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),

      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // Pass the startup logic off to our new async function
        state.initAuth(); 
      },
    }
  )
);