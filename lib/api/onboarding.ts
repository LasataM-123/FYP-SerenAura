import {API_URL} from '@/config';

export async function createOnboarding(params?: { responses: object, accessToken: string | null }): Promise<any> {
    const res = await fetch(`${API_URL}/onboarding/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${params?.accessToken}`
     },     
        body: JSON.stringify({responses: params?.responses }),
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Onboarding submission failed")
        }
    return res.json();

}