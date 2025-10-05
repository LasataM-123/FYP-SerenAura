import { useCallback, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
interface DecodedToken {
  exp: number;
  [key: string]: any;
}

interface UseBackendOptions<T, P extends Record<string, any>> {
  fn: (params?: P, token?: string) => Promise<T>;
  params?: P;
  checkOtp?: boolean;
}

interface UseBackendReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newParams?: P) => Promise<T | null>;
}

export function useBackend<T, P extends Record<string, any>>({
  fn,
  params,
  checkOtp = false,
}: UseBackendOptions<T, P>): UseBackendReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    accessToken,
    refreshToken,
    logout,
    otpToken,
    isOtpExpired,
    clearOtp,
  } = useAuthStore.getState();

  const fetchData = useCallback(
    async (newParams?: P): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        //  Check OTP expiry (if required)
        if (checkOtp && otpToken && isOtpExpired()) {
          clearOtp();
          router.replace("/signup");
          throw new Error("OTP token expired.");
        }

        // Check if refresh token itself expired (session ended)
        if (refreshToken) {
          const decoded: DecodedToken = jwtDecode(refreshToken);
          if (Date.now() > decoded.exp * 1000) {
            logout();
            throw new Error("Session expired. Please login again.");
          }
        }

        //  Perform API request with valid access token
        const result = await fn(newParams ?? params, accessToken ?? "");
        setData(result);
        return result;
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fn, params, accessToken, refreshToken, logout, otpToken, isOtpExpired, clearOtp, checkOtp]
  );

  const refetch = async (newParams?: P): Promise<T | null> => {
    return await fetchData(newParams);
  };

  return { data, loading, error, refetch };
}
