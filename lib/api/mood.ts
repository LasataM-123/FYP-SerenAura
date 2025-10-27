import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

export type MoodEntry = {
  _id: string;
  patientId: string;
  mood: string;
  feeling?: string;
  journal?: string;
  entryDate: string; // ISO date string
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrUpdateMoodResponse = {
  success: boolean;
  successMessage: string;
  data: MoodEntry;
}

export async function createOrUpdateMood(params?:{mood: string | null, feeling: string | null, journal: string | ""}): Promise<CreateOrUpdateMoodResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/mood/add-update`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     },
     body: JSON.stringify(params)
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Post request failed")
        }
    return res.json();
}
