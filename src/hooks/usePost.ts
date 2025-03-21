import {  useEffect, useState } from 'react'
import postService, { CanceledError,Post } from '../services/post-service';

export const usePosts = () => {
 const [posts,setPosts]=useState<Post[]>([]);
  const [error,setError]=useState<string|null>(null);
  const [isLoading,setIsLoading]=useState<boolean>(true);
 
  useEffect(() => {
    console.log("Fetching comments...");
    setIsLoading(true);
    const{request,abort} = postService.getAll<Post>("/posts");
    request.then((res)=>{
        setIsLoading(false);
        setPosts(res.data);
    }).catch((error)=>{
        if(!(error instanceof CanceledError)){
            setError(error.message);
            setIsLoading(false);
        }
        
        
    })
   
    return abort;

  },[]);
    return {posts,error,isLoading,setPosts,setError,setIsLoading};
}