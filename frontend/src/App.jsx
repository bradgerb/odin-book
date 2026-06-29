import { Outlet } from "react-router-dom";
// import styles from "./styles/App.module.css"
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div className="reader-layout">
      <Navbar/>
      <main>
        <Outlet/>
      </main>
    </div>
  )
}