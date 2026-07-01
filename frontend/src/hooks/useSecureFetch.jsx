import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useSecureFetch() {
    const { token, logout } = useAuth();
    const secureFetch = useCallback(async (url, options = {}) => {
        const headers = { ...options.headers };

        if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (response.status === 401) {
            console.error("Session expired or unauthorized!");
            logout();
            throw new Error("Session expired");
        }
        return response;
    }, [token, logout])
    return secureFetch;
}