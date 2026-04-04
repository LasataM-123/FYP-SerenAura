import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

export type BaseMedia = {
  _id: string;
  title: string;
  description: string;
  by: string;
  imageUrl: string;
  audioUrl: string;
  moodCategory: string;
  isLocked: boolean;
  isLockedForUser: boolean; 
};

export type MeditationItem = BaseMedia & {
  mediaType?: "Meditation";
};

export type MusicItem = BaseMedia & {
  mediaType?: "Music";
};

export type RecommendationItem<T = MeditationItem | MusicItem> = {
  title: string;
  data: T[];
};

export type IndividualMediaResponse<T = MeditationItem | MusicItem> = {
  success: true;
  media: T & {
    duration: string;
    mediaType: "Meditation" | "Music";
  };
};

export type RecommendationsResponse = {
  success: true;
  source: "mood" | "onboarding" | "random";
  recommendations: {
    [category: string]: RecommendationItem;
  };
};

/* ======================================================
   FILTER TYPES
====================================================== */

export type FilterAllResponse = {
  success: true;
  type: "all";
  data: {
    musicByCategory: Record<string, MusicItem[]>;
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

/* ======================================================
   SEARCH TYPES
====================================================== */

export type MoodCategory =
  | "calm"
  | "stress relief"
  | "focus"
  | "sleep"
  | "anxiety";

export type SearchParams = {
  keyword?: string;
  tag?: string;
};

export interface SearchAllData {
  musicByCategory: Record<MoodCategory, MusicItem[]>;
  meditations: MeditationItem[];
}

export interface SearchAllResponse {
  success: true;
  type: "all";
  data: SearchAllData;
}

export interface SearchMeditationResponse {
  success: true;
  type: "meditation";
  data: MeditationItem[];
}

export interface SearchMusicResponse {
  success: true;
  type: "music";
  data: MusicItem[];
}

export type SearchResponse =
  | SearchAllResponse
  | SearchMeditationResponse
  | SearchMusicResponse;

export async function getRecommendations(): Promise<RecommendationsResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/media/get-recommendations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Get request failed");
  }

  return res.json();
}

export async function getFilteredMedia(params?: {
  category: string;
}): Promise<FilterMediaResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(
    `${API_URL}/media/filter?category=${params?.category ?? ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch media");
  }

  return res.json();
}

export async function getIndividualMedia(params?: {
  id: string;
}): Promise<IndividualMediaResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(
    `${API_URL}/media/individual/${params?.id ?? ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch media");
  }

  return res.json();
}

export async function searchMedia(
  params?: SearchParams
): Promise<SearchResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const queryParams = new URLSearchParams();

  if (params?.keyword) queryParams.append("keyword", params.keyword);
  if (params?.tag && params.tag !== "All")
    queryParams.append("tag", params.tag);

  const res = await fetch(
    `${API_URL}/media/search?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Failed to fetch search results");
  }

  return res.json();
}
