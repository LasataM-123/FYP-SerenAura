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
  inhaleDescription: string;
  holdDescription: string;
  exhaleDescription: string;
}

export type IFormattedExercise = {
  _id: string;
  title: string;
  totalTime: number;
  imageUrl?: string;
}

export interface IBreathingResponse {
  success: boolean;
  breathingExercises: IFormattedExercise[];
}
export interface IBreathingIndividualResponse {
  success: boolean;
  breathingExercise: IBreathingExercise;
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

export async function getExerciseById(params?:{breatheId:string}): Promise<IBreathingIndividualResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/breathe/get/${params?.breatheId}`, {
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