import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const fromPath = location.state?.from ?? "/";

    async function handleSubmit(e) {
        e.preventDefault();
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),

            })
            let data = null;
            try {
                data = await response.json();
            } catch {
                data = null;
            }
            if (!response.ok) {
                console.log("error: ", data.error)
                setErrorMessage(data.error ?? "test error logging in");
                return;
            }
            login(data.token, data.user);
            toast.success("Logged in successfully");
            
            navigate(fromPath,
                {
                    replace: true,
                }) 
        } catch (err) {
            console.error(err)
        }
    }
    return (
        <div>
            <h1>User Login</h1>
            <form onSubmit={handleSubmit} >
                <label htmlFor="username">Username: </label>
                <input
                    id="username"
                    type="username"
                    name="username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value); setErrorMessage("");
                    }} required
                />

                <label htmlFor="password">Password: </label>
                <input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value); setErrorMessage("");
                    }} required
                />
                {errorMessage && <p role="alert">{errorMessage}</p>}
                <button type="submit">Log in</button>
            </form>

            <p>Do not have an account? <Link to="/register" state={{ from: fromPath }}>Register here</Link>.</p>
        </div>
    )
}