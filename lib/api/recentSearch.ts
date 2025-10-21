import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

export type RecentSearch = {
  _id: string;
  patientId: string;
  entryDate: string; 
  content: string;
};


export async function addSearch(params?:{content:string}): Promise<RecentSearch> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/recent-search/add`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     },
     body: JSON.stringify(params),
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Error in adding recent search");
        }
    return res.json();
}

export async function getRecentSearch(): Promise<RecentSearch[]> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/recent-search/get`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     }
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Get request failed")
        }
    return res.json();
}

export async function deleteRecentSearch(params?:{id:string}): Promise<RecentSearch> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/recent-search/delete/${params?.id}`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     }
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Delete request failed")
        }
    return res.json();
}

export async function suggestRecentSearch(params?:{query:string}): Promise<RecentSearch[]> {
      const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/recent-search/suggest?query=${params?.query}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     }
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Get request failed")
        }
    return res.json();
}