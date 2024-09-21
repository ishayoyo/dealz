import { Link } from "@remix-run/react";

export default function BottomNavigation({ className }: { className?: string }) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white shadow-sm dark:bg-gray-800 ${className}`}>
      <div className="flex justify-around py-2">
        <Link to="/" className="text-gray-600 dark:text-gray-300">Home</Link>
        <Link to="/search" className="text-gray-600 dark:text-gray-300">Search</Link>
        <Link to="/post" className="text-gray-600 dark:text-gray-300">Post Deal</Link>
        <Link to="/notifications" className="text-gray-600 dark:text-gray-300">Notifications</Link>
        <Link to="/profile" className="text-gray-600 dark:text-gray-300">Profile</Link>
      </div>
    </nav>
  );
}