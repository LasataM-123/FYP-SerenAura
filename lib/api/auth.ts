import { API_URL } from '@/config';
import { useAuthStore } from '@/store/authStore';
export type loginResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  userId: string;
  name:string;
  role: "patient" | "counselor";
};

export type OTPResponse = {
  message: string;
  otpToken: string;
};

export type ResetPasswordResponse = {
  email: string;
  success:string;
};

export type ProfileResponse = {
  success:boolean;
  message: string;
  profile: {
    name: string;
    email: string;
    profileUrl: string | null;
  };
}

export async function signup(params?: { name: string; dateOfBirth: string; email: string; password: string } ): Promise<OTPResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
   if (!res.ok) {
      const errBody = await res.json();
      throw new Error(errBody.message || "Signup failed")
    }
  return res.json();
}

export async function verifyOTPAndCreate(params?: { otp: string; otpToken: string }): Promise<loginResponse> {
  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error((await res.json()).message || "OTP failed");
  return res.json();
}

export async function login(params?: { email: string; password: string }): Promise<loginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Login failed");
  return res.json();
}

export async function resendOTP(params?:{otpToken: string }): Promise<OTPResponse> {
  const res = await fetch(`${API_URL}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Resend OTP failed");
  return res.json();
}

export async function resetPassword(params?: {email:string, newPassword: string, confirmPassword:string }): Promise<ResetPasswordResponse> {
  const res = await fetch(`${API_URL}/users/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Request password reset failed");
  return res.json();
}

export async function verifyOTP(params?: { otp: string; otpToken: string }): Promise<ResetPasswordResponse> {
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error((await res.json()).message || "OTP verification failed");
  return res.json();
}

export async function forgotPassword(params?: { email: string }): Promise<OTPResponse> {
  const res = await fetch(`${API_URL}/users/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

export async function addDOB(params?: { dateOfBirth: string, accessToken: string | null}): Promise<{ success: string }> {
  const res = await fetch(`${API_URL}/users/add-dob`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${params?.accessToken}`
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Adding date of birth failed");
  return res.json();
}

export async function getProfile(): Promise<ProfileResponse> {
  const accessToken = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_URL}/users/profile`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
  });
  if (!res.ok) throw new Error((await res.json()).message || "Get profile request failed");
  return res.json();
}

