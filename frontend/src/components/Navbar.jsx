import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css"

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <h2>Odinbook</h2>
            <ul>
                <li><NavLink to="/" className={({ isActive }) => isActive ? styles.active : ""} >Home Page</NavLink></li>
                {user ?
                    (
                        <>
                            <li><NavLink to="/friends" className={({ isActive }) => isActive ? styles.active : ""}>Friends</NavLink></li>
                            <li><span className="welcome-text">Hi, {user.username}</span></li>
                            <li><button onClick={logout} className="logout-btn">Logout</button></li>
                        </>

                    ) : (
                        <>
                            <li><NavLink to="/login" className={({ isActive }) => (isActive ? styles.active : "")}>Login</NavLink></li>
                            <li><NavLink to="/register" className={({ isActive }) => (isActive ? styles.active : "")}>Register</NavLink></li>
                        </>
                    )
                }
            </ul>
        </nav>
    )
}