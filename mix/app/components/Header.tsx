import { Link } from "@remix-run/react";
import { useState } from "react";
import PostDealModal from "./PostDealModal";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPostDealModalOpen, setIsPostDealModalOpen] = useState(false);

  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-indigo-600">DealzMix</Link>
        <div className="flex-grow mx-4 flex justify-center">
          <form className="relative w-1/2 max-w-md">
            <input
              type="text"
              placeholder="Search for deals..."
              className="w-full py-2 px-4 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
            <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
        <nav>
          <ul className="flex space-x-4 items-center">
            {isLoggedIn && (
              <li>
                <button
                  onClick={() => setIsPostDealModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Post a Deal
                </button>
              </li>
            )}
            {isLoggedIn ? (
              <>
                <li>
                  <Link to="/profile" className="text-gray-600 hover:text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                </li>
                <li>
                  <button className="text-gray-600 hover:text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                </li>
                <li>
                  <button onClick={toggleLogin} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                    Sign Up
                  </Link>
                </li>
              </>
            )}
            <li>
              <button
                onClick={toggleLogin}
                className={`px-3 py-1 rounded ${
                  isLoggedIn ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}
              >
                {isLoggedIn ? 'Simulate Logout' : 'Simulate Login'}
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <PostDealModal isOpen={isPostDealModalOpen} onClose={() => setIsPostDealModalOpen(false)} />
    </header>
  );
}