import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSecureFetch } from "../hooks/useSecureFetch";
import { formatDate } from "../utils/formatDate";
import odinImg from "../img/odin.png";
import likeOutline from "../img/likeOutline.svg";
import like from "../img/like.svg";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Dashboard() {

  const [posts, setPosts] = useState([]);
  const [postBody, setPostBody] = useState("");
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const secureFetch = useSecureFetch();

  const togglePostLike = async (postId) => {
    try {
      const response = await secureFetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to toggle like");
      }
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLikedByCurrentUser: result.liked,
                _count: {
                  ...post._count,
                  postLikes: result.postLikes,
                },
              }
            : post
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    async function loadPosts() {
      try {
        const response = await secureFetch(`${API_BASE_URL}/posts`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await response.json();
        if (cancelled) return;
        setPosts(data.posts ?? []);
      } catch (err) {
        console.error(err);
      }
    }
    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [secureFetch, user])

  return (
    <>
      {!user ? (
        <div className="center">
          <h1>Home page</h1>
          <p>Welcome to Odinbook!</p>
          <img src={odinImg} alt="Odin image" className="odinImage" height={200}/>
        </div>
      ) : (
        <>
          <div>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setError("");

                const content = postBody.trim();
                if (!content) {
                  setError("Post content cannot be empty");
                  return;
                }

                try {
                  const response = await secureFetch(`${API_BASE_URL}/posts`, {
                    method: "POST",
                    body: JSON.stringify({ content }),
                  });

                  const result = await response.json();
                  if (!response.ok) {
                    throw new Error(result.error || "Failed to submit post");
                  }

                  setPosts((current) => [result.post, ...current]);
                  setPostBody("");
                } catch (err) {
                  setError(err.message ?? "Error submitting post");
                }
              }}
            >
              <div>
                <label>
                  Post
                  <textarea
                    value={postBody}
                    onChange={(event) => setPostBody(event.target.value)}
                    placeholder="Write your post here"
                    rows={4}
                  />
                </label>
              </div>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <button type="submit">Submit post</button>
            </form>
          </div>
          <br />
          <div>
            {posts.length === 0 ? (
              <p>No posts yet</p>
            ) : (
              <div>
                <ul>
                  {posts.map((post) => (
                    <li key={post.id}>
                      <Link to={`/posts/${post.id}`}>
                        <div>{post.content}</div>
                        <hr />
                        <div>
                          Posted by: {post.author?.username ?? "deleted user"} • {formatDate(post.publishedDate)}
                        </div>
                      </Link>
                      <div>
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            togglePostLike(post.id);
                          }}
                          style={{ display: "inline" }}
                        >
                          <button
                            type="submit"
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              margin: 0,
                              cursor: "pointer",
                            }}
                            aria-label={post.isLikedByCurrentUser ? "Unlike this post" : "Like this post"}
                          >
                            <img
                              className="like"
                              src={post.isLikedByCurrentUser ? like : likeOutline}
                              alt={post.isLikedByCurrentUser ? "Unlike this post" : "Like this post"}
                            />
                          </button>
                        </form>
                        {post._count.postLikes} Likes • {post._count.comments} comments
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}