import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, Link, useLocation } from "react-router-dom";
import { useSecureFetch } from "../hooks/useSecureFetch";
import DOMPurify from 'dompurify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PostDetails() {
    const { token, user } = useAuth();
    const { postId } = useParams();
    const id = Number(postId);
    const idIsValid = Number.isFinite(id) && id > 0;
    const location = useLocation();


    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentBody, setCommentBody] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentBody, setEditCommentBody] = useState("");
    const [postStatus, setPostStatus] = useState("loading");

    const secureFetch = useSecureFetch();

    const loadComments = useCallback(async () => {
        try {
            const response = await secureFetch(`${API_BASE_URL}/posts/${id}/comments`, {
                method: "GET",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch comments");
            };
            const data = await response.json();
            setComments(data.comments ?? []);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    useEffect(() => {
        if (!idIsValid) return;
        let cancelled = false;
        async function loadPost() {
            setPostStatus("loading");
            setPost(null);
            try {
                const response = await secureFetch(`${API_BASE_URL}/posts/${id}`, {
                    method: "GET",
                });

                if (response.status === 404) {
                    if (!cancelled) setPostStatus("not-found");
                    return;
                }
                if (!response.ok) {
                    if (!cancelled) setPostStatus("error");
                    return;
                }
                const data = await response.json();
                if (cancelled) return;


                if (!data.post) {
                    if (!cancelled) setPostStatus("not-found");
                    return;
                }
                if (!cancelled) {
                    setPost(data.post);
                    setPostStatus("ready");
                    await loadComments();
                }

            } catch (err) {
                console.error(err);
                if (!cancelled) setPostStatus("error");
            }
        }
        loadPost();

        return () => {
            cancelled = true;
        };
    }, [id, idIsValid, loadComments]);

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMessage("");
        const trimmed = commentBody.trim();
        if (!trimmed) {
            setErrorMessage("Comment cannot be empty.");
            return;
        }
        try {
            const response = await secureFetch(`${API_BASE_URL}/posts/${id}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ commentBody: trimmed }),
            });

            let data = null;
            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                console.log("error: ", data.error)
                setErrorMessage(data?.error ?? `failed to create comment (${response.status})`);
                return;
            }

            setCommentBody("");
            setErrorMessage("");
            await loadComments();
        } catch (err) {
            console.error(err);
        }
    }

    async function deleteComment(postId, commentId) {
        try {
            const response = await secureFetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                let errorMessage = "Failed to Delete Comment";
                try {
                    const data = await response.json();
                    errorMessage = data.error ?? errorMessage;
                } catch {
                    console.error("Could not read error message");
                    console.log(response);
                }
                setErrorMessage(errorMessage);
                return;
            }
            setComments((prev) => prev.filter((comment) => comment.id !== commentId));
        } catch (err) {
            console.error(err)
        }
    }

    async function submitEdit(commentId) {
        const trimmed = editCommentBody.trim();
        if (!trimmed) {
            setErrorMessage("Edited comment cannot be empty.");
            return;
        }
        try {
            const response = await secureFetch(`${API_BASE_URL}/posts/${id}/comments/${commentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ commentBody: trimmed }),
            });


            let data = null;
            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                console.log("error: ", data.error)
                setErrorMessage(data?.error ?? `failed to edit comment (${response.status})`);
                return;
            }

            setEditingCommentId(null);
            setEditCommentBody("");
            setErrorMessage("");
            await loadComments();
        } catch (err) {
            console.error(err);
            setErrorMessage("Could not reach the server");
        }
    }

    if (!idIsValid) {
        return <div>Please input a valid id</div>;
    }
    if (postStatus === "loading") {
        return <p>Loading…</p>;
    }
    if (postStatus === "not-found") {
        return (
            <div>
                <p role="alert">Post not found.</p>
                <Link to="/">Back to home</Link>
            </div>
        );
    }
    if (postStatus === "error") {
        return (
            <div>
                <p role="alert">Could not load this post.</p>
                <Link to="/">Back to home</Link>
            </div>
        );
    }
    return (
        <div>
            <h2>Post Details:</h2>
            <p>Post Body:</p>
            <div
                className="post-body"
                dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content ?? ""),
                }}
            />
            <p>Author: {post.author?.username ?? "deleted user"}</p>

            <p>Leave a comment:</p>
            {errorMessage && <p role="alert">{errorMessage}</p>}

            {token ?
                (<div>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="commentBody">Comment: </label>
                        <input
                            id="commentBody"
                            type="text"
                            name="commentBody"
                            value={commentBody}
                            onChange={(e) => {
                                setCommentBody(e.target.value); setErrorMessage("");
                            }} required
                        />
                        <button type="submit">Submit comment</button>
                    </form>
                </div>) :
                (<div>To leave a comment, please <Link to="/login" state={{ from: location.pathname + location.search }}>log in</Link>.</div>)
            }
            <p>Comments ({comments.length}):</p>
            <ul>
                {comments.map((comment) => {
                    const isEdited = comment.updatedAt !== comment.publishedDate;
                    return (
                        <li key={comment.id}>
                            {editingCommentId === comment.id ? (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    submitEdit(comment.id);
                                }}>
                                    <input
                                        type="text"
                                        value={editCommentBody}
                                        onChange={(e) => setEditCommentBody(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="comment-btn" type="submit">Save</button>
                                    <button className="comment-btn"
                                        type="button"
                                        onClick={() => {
                                            setEditingCommentId(null);
                                            setEditCommentBody("");
                                            setErrorMessage("");
                                        }}>
                                        Cancel
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <div>{comment.body}</div>
                                    <div>{comment.author?.username ?? "deleted user"} - {isEdited ? `edited at: ${comment.updatedAt}` : `posted at: ${comment.publishedDate}`}</div>
                                    {user && (user?.id === comment.authorId) && (
                                        <button className="comment-btn"
                                            type="button"
                                            onClick={() => {
                                                setEditingCommentId(comment.id);
                                                setEditCommentBody(comment.body);
                                            }}>
                                            Edit
                                        </button>
                                    )}
                                    {user && (user?.id === comment.authorId || user?.role === "ADMIN") && (
                                        <button className="comment-btn" type="button" onClick={() => deleteComment(post.id, comment.id)}>
                                            Delete
                                        </button>
                                    )}
                                </>
                            )}
                        </li>
                    )
                })}
            </ul>

        </div>
    )
}