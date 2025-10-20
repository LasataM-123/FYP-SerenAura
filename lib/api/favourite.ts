import { useAuthStore } from "@/store/authStore";
import { MeditationItem, MusicItem } from "./media";
import { API_URL } from "@/config";

export type Favourite = {
  _id: string;
  mediaType: "Meditation" | "Music"; 
  media: MeditationItem | MusicItem; 
}

export type AddFavouriteResponse = {
  success: boolean;
  newFavourite: {
    _id: string;
    patientId: string;
    mediaId: string;
    mediaType: "Meditation" | "Music"; 
    createdAt?: string;
    updatedAt?: string;
  };
}

export type GetFavouritesResponse = {
  count: number;
  favourites: Favourite[];
}

export type RemoveFavouriteResponse = {
  success: boolean;
  message: string;
}

export type CheckFavouriteResponse = {
  isFavourite: boolean;
}

export async function addFavourite(params?:{mediaId: string, mediaType: 'Music' | 'Meditation'}): Promise<AddFavouriteResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/favourite/add`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache", 
        "Authorization": `Bearer ${accessToken}`
     },
     body: JSON.stringify(params)
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.error || "Error while adding favourite")
        }
    return res.json();
}

export async function checkFavourite(params?:{mediaId: string}): Promise<CheckFavouriteResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/favourite/check/${params?.mediaId}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache", 
        "Authorization": `Bearer ${accessToken}`
     },
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Error while checking favourite")
        }
    return res.json();
}

export async function getFavourites(params?:{mediaId: string}): Promise<GetFavouritesResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/favourite/check/${params?.mediaId}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache", 
        "Authorization": `Bearer ${accessToken}`
     },
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Get request failed")
        }
    return res.json();
}

export async function removeFavourite(params?:{mediaId: string}): Promise<GetFavouritesResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/favourite/check/${params?.mediaId}`, {
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

