import { useAuthStore } from "@/store/authStore";
import { MeditationItem, MusicItem } from "./media";
import { API_URL } from "@/config";

export type MediaType = "Music" | "Meditation";

export type Playlist = {
  _id: string;
  patientId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type PlaylistJunction = {
  _id: string;
  mediaType: MediaType;
  mediaId: string;
  playlistId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlaylistResponse = {
  message: string;
  playlist: Playlist;
};

export type AddMediaToPlaylistResponse = {
  message: string;
  added: PlaylistJunction;
};

export type GetUserPlaylistsResponse = {
  playlists: {
    _id: string;
    title: string;
    imageUrl: string | null;
    totalVideos?: number | 0;
    createdAt: string;
  }[];
};

export type GetPlaylistByIdResponse = {
  playlist: {
    _id: string;
    title: string;
    imageUrl: string | null;
  };
  media: {
    _id: string; 
    mediaType: MediaType;
    media: MusicItem | MeditationItem;
    duration:number;
  }[];
};

export type RemoveMediaFromPlaylistResponse = {
    success: Boolean;
    message: string;
};

export type DeletePlaylistResponse = {
    success: Boolean;
    message: string;
};

export type CheckResponse = {
  exists: boolean;
}


export async function createPlaylist(params?:{title: String}): Promise<CreatePlaylistResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/playlist/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     },
     body: JSON.stringify(params)
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Error while creating playlist")
        }
    return res.json();
}

export async function addMediaToPlaylist(params?: {
  playlistId: string;
  mediaId: string;
  mediaType: MediaType;
}): Promise<AddMediaToPlaylistResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/playlist/add/${params?.playlistId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      mediaId: params?.mediaId,
      mediaType: params?.mediaType,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Error while adding media to playlist");
  }

  return res.json();
}


export async function getUserPlaylists(): Promise<GetUserPlaylistsResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/playlist`, {
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
export async function getPlaylistById(params?:{playlistId: string}): Promise<GetPlaylistByIdResponse> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/playlist/get/${params?.playlistId}`, {
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

export async function checkPlaylists(params?:{mediaId: String}): Promise<CheckResponse> {
    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/playlist/check/${params?.mediaId}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     },
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Check request failed")
        }
    return res.json();
}

