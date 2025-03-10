import { CredentialResponse } from "@react-oauth/google";
import  { apiClient,CanceledError } from "./api-client";
import defaultImage from '../assets/avatar.png';


export { CanceledError }

export interface IUser {
    _id?: string,
    email: string,
    password?: string,
    imgUrl?: string,
    accessToken?: string,
    refreshToken?: string,
}

const register = (user: IUser) => {
    const abortController = new AbortController()
    const request = apiClient.post<IUser>('/auth/register',
        user,
        { signal: abortController.signal })
    return { request, abort: () => abortController.abort() }
}

const googleSignIn = (credential:CredentialResponse) => {
    const abortController = new AbortController()
    const request = apiClient.post<IUser>('/auth/google',
        credential,
        { signal: abortController.signal })
    return { request, abort: () => abortController.abort() }
}


const uploadImage = (img: File | null) => {
    const formData = new FormData();
    if (!img) {
        return fetch(defaultImage)
            .then(res => res.blob())
            .then(blob => {
                const defaultFile = new File([blob], "default.png", { type: "image/png" });
                formData.append("file", defaultFile);
                
                const request = apiClient.post('/file?file=default.png', formData, {
                    headers: {
                        'Content-Type': 'image/png'
                    }
                });
                
                return { request };
            });
    }
    
    formData.append("file", img);
    const request = apiClient.post('/file?file=' + img.name, formData, {
        headers: {
            'Content-Type': 'image/*'
        }
    });
    
    return { request };
};




export default { register, uploadImage, googleSignIn }