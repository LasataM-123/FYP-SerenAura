import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

export type SubscriptionType = "monthly" | "yearly";

export type Subscription = {
  _id: string;
  patientId: string;
  subscriptionType: SubscriptionType;
  startDate: string;
  endDate: string;
  status: "active" | "cancelled" | "expired";
}

export type SubscriptionResponse = {
    success: boolean;
    subscription: Subscription;
}

export type SubscriptionPayload = {
    pidx: string;
    subscriptionType: SubscriptionType;
}

export async function subscribePatient(
  payload: SubscriptionPayload
): Promise<SubscriptionResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Subscription failed");
  }

  return res.json();
}

export async function renewSubscription(
  payload: SubscriptionPayload
): Promise<SubscriptionResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/subscribe/renew`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Subscription renewal failed");
  }

  return res.json();
}

export async function cancelSubscription(): Promise<SubscriptionResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/subscribe/cancel`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Subscription cancellation failed");
  }

  return res.json();
}