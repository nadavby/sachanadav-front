/** @format */

import { FC } from "react";
import { usePosts } from "../../hooks/usePost";
import { Post } from "../../services/post-service";

const ListPosts: FC = () => {
  const { posts, isLoading, error, setPosts } = usePosts();
  console.log(posts);

  return (
    <div>
      {error && <p className="alert alert-danger">Error : {error}</p>}

      {isLoading && !error && <p>isLoading...</p>}

      {!isLoading && posts.length === 0 && !error && (
        <p className="alert alert-warning">No post </p>
      )}

      {posts.length > 0 && (
        <div className="row">
          {posts.map((post: Post) => (
            <div
              key={post._id}
              className="row-mb-4">
              <div className="card m-3 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{post.title}</h5>
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      style={{ width: "10%", marginTop: 10 }}
                    />
                  )}
                  <p className="card-text">{post.content}</p>
                  <p className="text-muted">Author : {post.owner} </p>
                  <p className="text-success"> {post.likes.length} Likes</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary m-3"
        onClick={() => setPosts([...posts])}>
        Refresh
      </button>
    </div>
  );
};

export default ListPosts;
