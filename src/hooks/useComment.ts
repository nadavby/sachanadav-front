import { useEffect, useState } from "react";
import commentService, { CanceledError, Comment } from "../services/comment-service";

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log("Fetching comments...");
    setIsLoading(true);

    const { request, abort } = commentService.getAll<Comment>("/comments");
    request
      .then((res) => {
        setIsLoading(false);
        setComments(res.data);
      })
      .catch((error) => {
        if (!(error instanceof CanceledError)) {
          setError(error.message);
          setIsLoading(false);
        }
      });

    return abort; 
  }, []);

  return { comments, error, isLoading, setComments, setError, setIsLoading };
};
