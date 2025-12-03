import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";
import { DeleteResponse } from "./auth";

export type CounselorType = {
  _id: string;
  name: string;
  profileUrl: string;
  experience:number;
  speciality: string;
}

export type GetCounselorResponse = {
  success: boolean;
  counselors: CounselorType[];
}

export type GetIndividualCounselor = {
    success: boolean;
    counselor: CounselorType;
}

export async function getAllCounselors(): Promise<GetCounselorResponse> {
    const res = await fetch(`${API_URL}/counselors/get`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
     },
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Get request failed")
        }
    return res.json();
}

export async function getIndividualCounselor(params?:{id:string}): Promise<GetIndividualCounselor> {
    const accessToken = useAuthStore.getState().accessToken;
    
    const res = await fetch(`${API_URL}/counselors/get/${params?.id}`, {
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
export async function deleteCounselorAccount(): Promise<DeleteResponse> {
    const accessToken = useAuthStore.getState().accessToken;
    
    const res = await fetch(`${API_URL}/counselors/delete`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
         "Authorization": `Bearer ${accessToken}`

     },
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Delete request failed")
        }
    return res.json();
}