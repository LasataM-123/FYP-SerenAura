import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

export type IBreathingExercise = {
  _id: string;
  title: string;
  inhaleTime: number;
  holdTime: number;
  exhaleTime: number;
  cycles: number;
  imageUrl?: string;
}

export type IFormattedExercise = {
  _id: string;
  title: string;
  totalTime: number;
  imageUrl?: string;
}

interface IBreathingResponse {
  success: boolean;
  breathingExercises: IFormattedExercise[];
}

export async function getAllExercises(): Promise<IBreathingResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/breathe/get`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     },
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Get request failed")
        }
    return res.json();
}