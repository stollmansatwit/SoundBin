// Login.tsx
// Login page including a form for user authentication and a button to submit that links to API for authentication.
// After authentication, routes to App.tsx page. If authentication fails, displays an error message and allow retries

//import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
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
    const navigate = useNavigate();



    // Authentication logic here (e.g., call an API to verify credentials)




    async function handleSubmit(event: React.ChangeEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;


        // Check if the user is already authenticated
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/home');
        } else {
            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
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

    }



    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-orange-400 to-gray-500">
            <h1 className="text-4xl font-bold text-white mb-8">Login</h1>
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
            </form>
        </div>
    )
}