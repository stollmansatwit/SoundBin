// Login.tsx
// Login page including a form for user authentication and a button to submit that links to API for authentication.
// After authentication, routes to App.tsx page. If authentication fails, displays an error message and allow retries

//import bcrypt from "bcryptjs";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from '../config';
/*
Steps:
1. Create a form with input fields for username and password.
2. Add a submit button that triggers the authentication process.
3. Implement a function to handle form submission and send the credentials to the API for authentication.
4. If authentication is successful, redirect the user to the App.tsx page.
5. If authentication fails, display an error message and allow the user to retry.
*/


export default function Login() {
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null); // message for when user already is signed in
    const navigate = useNavigate();
    const location = useLocation();
    const infoMessage = (location.state as { message?: string } | null)?.message;

    // useEffect hook to check if token already exists on page load
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            setMessage("Already Signed In. Navigating to home page...")
            setTimeout(() => { navigate('/home') }, 2000)
        }

    });

    // Authentication logic here (e.g., call an API to verify credentials)


    async function handleSubmit(event: React.ChangeEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;


        // Check if the user is already authenticated
        // const token = localStorage.getItem('token');
        // if (token) {
        //     console.log(token)
        //     navigate('/home');
        // } else {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            console.log("Response data:", data);



            if (response.ok) {
                localStorage.setItem('token', data.token);
                navigate('/home');
            } else {
                setError(data.error || 'Authentication failed');
                console.error('Authentication failed');
            }
        } catch (error) {
            console.error('Error during authentication:', error);
            setError('Something went wrong. Please try again.');
        }
    }





    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-orange-400 to-gray-500">
            <h1 className="text-4xl font-bold text-white mb-8">Login</h1>
            {infoMessage && (
                <p className="mb-4 max-w-sm text-center text-sm font-semibold text-white bg-green-600/80 rounded-md px-4 py-2">
                    {infoMessage}
                </p>
            )}
            <form className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                    // Implement authentication logic here
                }}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        Username
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        name="username"
                        type="text"
                        placeholder="Username"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        name="password"
                        type="password"
                        placeholder="********"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"

                    >
                        Sign In
                    </button>
                </div>
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </form>
            {message &&
                <div className="fixed inset-0 flex items-center justify-center bg-white/80">
                    <div className = "flex flex-col items-center gap-4">
                    <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                    <strong className="text-xl">{message}</strong>
                    </div>
                </div>}
        </div>
    )
}