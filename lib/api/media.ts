import { API_URL } from '@/config';
import { useAuthStore } from '@/store/authStore';

export type MeditationItem = {
  _id: string;
  title: string;
  description: string;
  by: string;
  imageUrl: string;
  audioUrl: string;
  moodCategory: string;
  isLocked: boolean;
};

export type MusicItem = {
  _id: string;
  title: string;
  description: string;
  by: string;
  imageUrl: string;
  audioUrl: string;
  moodCategory: string;
  isLocked: boolean;
};

export type RecommendationItem<T = MeditationItem | MusicItem> = {
  title: string;       
  data: T[];           
};

export type RecommendationsResponse = {
  success: true;
  source: "mood" | "onboarding" | "random";
  recommendations: {
    [category: string]: RecommendationItem;
  };
};

export type FilterAllResponse = {
  success: true;
  type: "all";
  data: {
    musicByCategory: Record<string, MusicItem[]>; // e.g. calm, stress, sleep
    meditations: MeditationItem[];
  };
};

export type FilterMusicResponse = {
  success: true;
  type: "music";
  data: MusicItem[];
};

export type FilterMeditationResponse = {
  success: true;
  type: "meditation";
  data: MeditationItem[];
};

export type FilterMediaResponse =
  | FilterAllResponse
  | FilterMusicResponse
  | FilterMeditationResponse;

export async function getRecommendations(): Promise<RecommendationsResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/music/get-recommendations`, {
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

export async function getFilteredMedia(params?:{category:string}):Promise<FilterMediaResponse>{
    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/music/filter?category=${params?.category ?? ""}`, {
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch media");
    }
    return res.json();
}