import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

// 1. Keep the strict type for safety
export type SubscriptionType = "monthly" | "yearly";

export type Subscription = {
  _id: string;
  patientId: string;
  subscriptionType: SubscriptionType;
  startDate: string;
  endDate: string;
  status: "active" | "cancelled" | "expired";
};

export type SubscriptionResponse = {
  success: boolean;
  message?: string;
  subscription?: Subscription;
};

export type InitPaymentResponse = {
  success: boolean;
  amount: number;
  product_code: string;
  signature: string;
  uuid: string;
  payment_url?: string;
};

export type SubscribePayload = {
  pid: string;
  subscriptionType: string; 
};

export type status = {
  isSubscribed: boolean;
  subscriptionType: SubscriptionType | null;
  endDate: string | null;
}

export async function initiatePayment(
  subscriptionType: string
): Promise<InitPaymentResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/subscription/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ subscriptionType }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Payment initiation failed");
  }

  return res.json();
}

export async function subscribePatient(
  payload: SubscribePayload
): Promise<SubscriptionResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/subscription/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Subscription verification failed");
  }

  return res.json();
}

export async function renewSubscription(
  payload: SubscribePayload
): Promise<SubscriptionResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/subscription/renew`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Subscription renewal failed");
  }

  return res.json();
}

export async function cancelSubscription(): Promise<SubscriptionResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/subscription/cancel`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Subscription cancellation failed");
  }

  return res.json();
}

export async function getSubscriptionStatus(): Promise<status> {
  const accessToken = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_URL}/subscription/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Subscription status fetch failed");
  }

  return res.json();
}