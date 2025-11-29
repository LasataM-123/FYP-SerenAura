import { useAuthStore } from "@/store/authStore";
import { MeditationItem, MusicItem } from "./media";
import { API_URL } from "@/config";
import { MediaType } from "./playlist";

export type Favourite = {
  _id: string;
  mediaType: MediaType; 
  media: MeditationItem | MusicItem; 
  duration: number;
}

export type AddFavouriteResponse = {
  success: boolean;
  newFavourite: {
    _id: string;
    patientId: string;
    mediaId: string;
    mediaType: MediaType; 
    createdAt?: string;
    updatedAt?: string;
  };
}

export type GetFavouritesResponse = {
  count: number;
   favourites: {
    _id: string; 
    mediaType: MediaType;
    media: MusicItem | MeditationItem;
    duration:number;
  }[];
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
        "Authorization": `Bearer ${accessToken}`
     },
     body: JSON.stringify(params)
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Error while adding favourite")
        }
    return res.json();
}

export async function checkFavourite(params?:{mediaId: string}): Promise<CheckFavouriteResponse> {
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
        throw new Error(errBody.message || "Error while checking favourite")
        }
    return res.json();
}

export async function getFavourites(): Promise<GetFavouritesResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/favourite/get`, {
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

