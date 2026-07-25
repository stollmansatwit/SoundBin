// RegisterUser.tsx
// Registration page including a form for user registration and a button to submit that links to API for registration.
// After registration, routes to Login.tsx page. If registration fails, displays an error message and allow retries

import { useState } from "react";
import { useNavigate } from "react-router-dom";

/*
Steps:
1. Create a form with input fields for username and password
2. Add a submit button that triggers the registration process.
3. Implement a function to handle form submission and send the credentials to the API for registration.
4. Link API with backend database to store user credentials
5. If registration is successful, redirect the user to the Login.tsx page.
6. If registration fails, display an error message and allow the user to retry.

We can add recovery email and other fields later, but for now, we will keep it simple with just username and password.
*/

export default function RegisterUser() {
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function handleSubmit(event: React.ChangeEvent<HTMLFormElement>) {
        event.preventDefault();
        
        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        console.log("Username:", username);
        console.log("Password:", password);

        // Registration logic here (e.g., call an API to register user)
        fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
            .then(response => {
                if (response.ok) {
                    navigate('/login'); // Navigate to the Login.tsx page after successful registration
                } else {
                    setError('Registration failed');
                    console.error('Registration failed');
                }
            })
            .catch(error => {
                setError('An error occurred during registration');
                console.error('An error occurred during registration:', error);
            });
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-orange-400 to-gray-500">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800">Register</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-orange-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-orange-400"
                        />
                    </div>


                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring focus:ring-orange-400"
                    >
                        Register
                    </button>
                </form>
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
        </div>
    );
}