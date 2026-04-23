import { useAuthStore } from "@/store/authStore";
import { API_URL } from "@/config";

/* =========================
   TYPES
========================= */

export type Review = {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    profileUrl?: string;
  };
  counselorId: string;
  text: string;
  rating: number;
  reviewDate?: string;
};

export type AddReviewResponse = {
  success: boolean;
  message: string;
  review: Review;
};

export type GetReviewsResponse = {
  success: boolean;
  count: number;
  averageRating: number;
  reviews: Review[];
};

/* =========================
   API FUNCTIONS
========================= */

// ➤ Add Review
export async function addReview(params?: {
  chatId: string;
  text: string;
  rating: number;
}): Promise<AddReviewResponse> {

  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/reviews/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Error while adding review");
  }

  return res.json();
}


// ➤ Get Reviews by Counselor
export async function getReviewsByCounselor(
  counselorId: string
): Promise<GetReviewsResponse> {

  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/reviews/counselor/${counselorId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Error fetching reviews");
  }

  return res.json();
}