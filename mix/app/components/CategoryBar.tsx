import { Link } from "@remix-run/react";

const categories = [
  "Electronics", "Fashion", "Home", "Beauty", "Sports", "Kids", "Auto", "Books", "Grocery", "Travel"
];

export default function CategoryBar() {
  return (
    <div className="flex overflow-x-auto hide-scrollbar">
      <div className="flex space-x-4 p-4">
        {categories.map((category) => (
          <Link
            key={category}
            to={`/category/${category.toLowerCase()}`}
            className="px-4 py-2 bg-white text-gray-800 rounded-full shadow hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
}