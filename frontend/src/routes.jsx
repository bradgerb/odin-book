import App from "./App";
import Home from "./pages/Home";
import PostDetails from "./pages/PostDetails";
import Login from "./pages/Login";
import Register from "./pages/Register"
import ErrorPage from "./components/ErrorPage";
import Friends from "./pages/Friends";

const routes = [
    {
        path: "/",
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "posts/:postId",
                element: <PostDetails />,
            },
            {
                path: "login",
                element: <Login />
            },
            {
                path: "register",
                element: <Register />
            },
            {
                path: "friends",
                element: <Friends />
            }
        ]
    }
]

export default routes;