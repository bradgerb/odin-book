import { useRouteError, Link } from "react-router-dom";

export default function ErrorPage() {
    const error = useRouteError();
    console.error(error);
    return (
        <div>
            <h1>an unexpected error has occurred.</h1>
            <p>Error: <i>({error.status}) {error.statusText}</i></p>
            <Link to="/">
                Return to Home
            </Link>
        </div>
    );
}