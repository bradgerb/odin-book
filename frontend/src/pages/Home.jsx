import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import odinImg from "../img/odin.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Dashboard() {

  const [posts, setPosts] = useState([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function loadPosts() {
      try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        };
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
  }, [])

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
            New post form
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
                        <div>Title: {post.title} - Author: {post.author?.username ?? "deleted user"} - nrofcomments: {post._count.comments}</div>
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