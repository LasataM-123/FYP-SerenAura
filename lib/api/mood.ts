import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

// === ADDED AI & MEDIA TYPES ===
export type MediaSuggestion = {
  _id: string;
  title: string;
  description: string;
  by: string;
  imageUrl: string;
  audioUrl: string;
  moodCategory: string;
  isLocked: boolean;
};

export type Suggestions = {
  empathyMessage: string;
  breathingExercise: {
    name: string;
    description: string;
    steps: string[];
  };
  musicSuggestion?: MediaSuggestion;
  meditationSuggestion?: MediaSuggestion;
};
// ==============================

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

// === UPDATED RESPONSE TYPE ===
export type CreateOrUpdateMoodResponse = {
  success: boolean;
  successMessage: string;
  data: MoodEntry;
  suggestions?: Suggestions; 
}
// ==============================

export type TopFeeling = {
  feeling: string;
  count: number;
}

export interface MoodPercentages {
  [mood: string]: string; 
}

export type CommonMood = {
  mood: string;
  count: number;
};

export type MonthlyInsightsSuccessResponse = {
  success: true;
  totalEntries: number;
  mostCommonMoods: CommonMood[]; // Changed from string to handle ties
  topFeelings: TopFeeling[];     // Array of 1 to 3 items
  moodPercentages: MoodPercentages;
};

export interface MonthlyInsightsEmptyResponse {
  success: true;
  message: string;
}

export type MonthlyInsightsResponse =
  | MonthlyInsightsSuccessResponse
  | MonthlyInsightsEmptyResponse;

export type TodayMoodResponse = {
  success: true;
  data: MoodEntry | null;
}

export type CalendarMoodQuery = {
  month?: string; 
  year?: string;  
}

export type CalendarMoodDay = {
  day: number;
  mood: string | null;
  journal: string | null;
  feeling: string[] | null;
}

export type CalendarMoodSuccessResponse = {
  success: true;
  month: number;
  year: number;
  daysInMonth: number;
  entries: CalendarMoodDay[];
}

export type CalendarMoodErrorResponse ={
  success: false;
  message: string;
}

export type CalendarMoodResponse =
  | CalendarMoodSuccessResponse
  | CalendarMoodErrorResponse;

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

// Update the signature to accept a single object
export async function getMoodCalendar(params?: { month?: number; year?: number }): Promise<CalendarMoodResponse> {
    const accessToken = useAuthStore.getState().accessToken;
    
    // Destructure from the params object
    const { month, year } = params || {};

    const queryParams = new URLSearchParams();
    if (month) queryParams.append('month', month.toString());
    if (year) queryParams.append('year', year.toString());

    const res = await fetch(`${API_URL}/mood/calendar?${queryParams.toString()}`, {
        method: "GET",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
    });

    if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Get request failed");
    }
    return res.json();
}

// Update this one too
export async function getMoodInsights(params?: { month?: number; year?: number }): Promise<MonthlyInsightsResponse> {
    const accessToken = useAuthStore.getState().accessToken;
    
    const { month, year } = params || {};

    const queryParams = new URLSearchParams();
    if (month) queryParams.append('month', month.toString());
    if (year) queryParams.append('year', year.toString());

    const res = await fetch(`${API_URL}/mood/insights?${queryParams.toString()}`, {
        method: "GET",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
    });

    if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Get request failed");
    }
    return res.json();
}

export async function getTodayMood(): Promise<TodayMoodResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error("No access token yet");
  }

  const res = await fetch(`${API_URL}/mood/today`, {
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