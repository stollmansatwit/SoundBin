// Welcome Page
// This page is displayed when the user first visits the site
// Overview of the application and its features
// Links to Login.tsx and RegisterUser.tsx pages

import { Link } from "react-router-dom";

export default function Welcome() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-orange-400 to-gray-500">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center text-gray-800">Welcome to SoundBin</h1>
                <p className="text-center text-gray-600">Your ultimate music experience</p>
                <div className="flex flex-col space-y-4">
                    <Link
                        to="/login"
                        className="px-4 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring focus:ring-orange-400"
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="px-4 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring focus:ring-orange-400"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}