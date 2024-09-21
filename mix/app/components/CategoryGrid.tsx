import { Link } from "@remix-run/react";

const categories = [
  { id: "1", name: "Electronics", icon: "🖥️", dealCount: 42 },
  { id: "2", name: "Fashion", icon: "👚", dealCount: 38 },
  { id: "3", name: "Home", icon: "🏡", dealCount: 29 },
  { id: "4", name: "Beauty", icon: "💄", dealCount: 25 },
  { id: "5", name: "Sports", icon: "⚽", dealCount: 31 },
  { id: "6", name: "Kids", icon: "🧸", dealCount: 20 },
  { id: "7", name: "Auto", icon: "🚗", dealCount: 15 },
  { id: "8", name: "Books", icon: "📚", dealCount: 33 },
  { id: "9", name: "Grocery", icon: "🍎", dealCount: 27 },
  { id: "10", name: "Travel", icon: "✈️", dealCount: 18 },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/category/${category.id}`}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out"
        >
          <span className="text-3xl mb-2">{category.icon}</span>
          <span className="text-sm font-medium text-gray-800 text-center">{category.name}</span>
          <span className="text-xs text-indigo-600 mt-1">{category.dealCount} deals</span>
        </Link>
      ))}
    </div>
  );
}