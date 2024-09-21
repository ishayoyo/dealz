import { useState } from 'react';
import { Link, Outlet } from '@remix-run/react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('deals');

  const tabs = [
    { id: 'deals', label: 'Manage Deals' },
    { id: 'users', label: 'Manage Users' },
    { id: 'comments', label: 'Manage Comments' },
    { id: 'categories', label: 'Manage Categories' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Panel</h1>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={`/admin/${tab.id}`}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}