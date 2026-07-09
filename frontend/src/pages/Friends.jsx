import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSecureFetch } from "../hooks/useSecureFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function LoadingMessage({ message }) {
  return <p style={{ color: "#555" }}>{message}</p>;
}

export default function Friends() {
  const { user } = useAuth();
  const secureFetch = useSecureFetch();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshFriendData = async () => {
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      const [pendingResponse, friendsResponse] = await Promise.all([
        secureFetch(`${API_BASE_URL}/users/friend-requests`, { method: "GET" }),
        secureFetch(`${API_BASE_URL}/users/friends`, { method: "GET" }),
      ]);

      const pendingResult = await pendingResponse.json();
      const friendsResult = await friendsResponse.json();

      if (!pendingResponse.ok) {
        throw new Error(pendingResult.error || "Unable to load friend requests");
      }
      if (!friendsResponse.ok) {
        throw new Error(friendsResult.error || "Unable to load friends");
      }

      setIncomingRequests(pendingResult.incoming ?? []);
      setOutgoingRequests(pendingResult.outgoing ?? []);
      setFriends(friendsResult.friends ?? []);
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Error loading friend data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFriendData();
  }, [user]);

  const runSearch = async (event) => {
    event?.preventDefault();
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await secureFetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }
      setSearchResults(data.users ?? []);
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Search error");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (receiverId) => {
    setError("");
    try {
      const response = await secureFetch(`${API_BASE_URL}/users/friend-requests`, {
        method: "POST",
        body: JSON.stringify({ receiverId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send request");
      }
      await refreshFriendData();
      await runSearch();
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Unable to send request");
    }
  };

  const acceptRequest = async (requestId) => {
    setError("");
    try {
      const response = await secureFetch(`${API_BASE_URL}/users/friend-requests/${requestId}/accept`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to accept request");
      }
      await refreshFriendData();
      await runSearch();
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Unable to accept request");
    }
  };

  const rejectRequest = async (requestId) => {
    setError("");
    try {
      const response = await secureFetch(`${API_BASE_URL}/users/friend-requests/${requestId}/reject`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to reject request");
      }
      await refreshFriendData();
      await runSearch();
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Unable to reject request");
    }
  };

  const cancelRequest = async (requestId) => {
    setError("");
    try {
      const response = await secureFetch(`${API_BASE_URL}/users/friend-requests/${requestId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel request");
      }
      await refreshFriendData();
      await runSearch();
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Unable to cancel request");
    }
  };

  const removeFriend = async (friendId) => {
    setError("");
    try {
      const response = await secureFetch(`${API_BASE_URL}/users/friends/${friendId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to remove friend");
      }
      await refreshFriendData();
      await runSearch();
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Unable to remove friend");
    }
  };

  if (!user) {
    return (
      <div className="center">
        <h1>Friends</h1>
        <p>Please log in to search for friends, view requests, and manage connections.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Friends</h1>

      <section>
        <h2>Search friends</h2>
        <form onSubmit={runSearch}>
          <label>
            Username
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by username"
            />
          </label>
          <button type="submit">Search</button>
        </form>

        {loading && <LoadingMessage message="Loading friends data... This may take a moment while the free database wakes up." />}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div>
          {searchResults.length === 0 ? (
            <p>Search for a username to send friend requests.</p>
          ) : (
            <ul>
              {searchResults.map((result) => (
                <li key={result.id} style={{ marginBottom: 12 }}>
                  <strong>{result.username}</strong>
                  {result.relation === "NONE" && (
                    <button className="comment-btn" onClick={() => sendRequest(result.id)} style={{ marginLeft: 8 }}>
                      Send request
                    </button>
                  )}
                  {result.relation === "REQUEST_SENT" && <span style={{ marginLeft: 8 }}>Request sent</span>}
                  {result.relation === "REQUEST_RECEIVED" && (
                    <span style={{ marginLeft: 8 }}>Incoming request</span>
                  )}
                  {result.relation === "FRIENDS" && <span style={{ marginLeft: 8 }}>Friends</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2>Pending requests</h2>
        <div>
          <h3>Incoming</h3>
          {incomingRequests.length === 0 ? (
            <p>No incoming requests.</p>
          ) : (
            <ul>
              {incomingRequests.map((request) => (
                <li key={request.requestId} style={{ marginBottom: 12 }}>
                  <strong>{request.username}</strong>
                  <button className="comment-btn" onClick={() => acceptRequest(request.requestId)} style={{ marginLeft: 8 }}>
                    Accept
                  </button>
                  <button className="comment-btn" onClick={() => rejectRequest(request.requestId)} style={{ marginLeft: 8 }}>
                    Reject
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3>Outgoing</h3>
          {outgoingRequests.length === 0 ? (
            <p>No outgoing requests.</p>
          ) : (
            <ul>
              {outgoingRequests.map((request) => (
                <li key={request.requestId} style={{ marginBottom: 12 }}>
                  <strong>{request.username}</strong>
                  <button className="comment-btn" onClick={() => cancelRequest(request.requestId)} style={{ marginLeft: 8 }}>
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2>Friends</h2>
        {friends.length === 0 ? (
          <p>You currently have no friends.</p>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend.id} style={{ marginBottom: 12 }}>
                <strong>{friend.username}</strong>
                <button className="comment-btn" onClick={() => removeFriend(friend.id)} style={{ marginLeft: 8 }}>
                  Remove friend
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
