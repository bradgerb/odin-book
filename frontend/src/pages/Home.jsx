import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSecureFetch } from "../hooks/useSecureFetch";
import { formatDate } from "../utils/formatDate";
import odinImg from "../img/odin.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Dashboard() {

  const [posts, setPosts] = useState([]);
  const [postBody, setPostBody] = useState("");
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const secureFetch = useSecureFetch();

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
                        <div>
                          Posted by: {post.author?.username ?? "deleted user"} • {formatDate(post.publishedDate)}
                        </div>
                        <div>{post._count.comments} comments</div>
                      </Link>
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