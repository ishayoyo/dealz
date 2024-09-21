import { useState } from 'react';

// Mock data
const deals = [
  { id: '1', title: '50% off on Amazon Echo Dot', store: 'Amazon', status: 'active' },
  { id: '2', title: 'Buy one, get one free at Starbucks', store: 'Starbucks', status: 'pending' },
];

export default function ManageDeals() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDeals = deals.filter(deal => 
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.store.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    // Implement delete logic here
    console.log(`Delete deal with id: ${id}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Deals</h2>
      <input
        type="text"
        placeholder="Search deals..."
        className="w-full p-2 mb-4 border rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredDeals.map((deal) => (
            <tr key={deal.id}>
              <td className="px-6 py-4 whitespace-nowrap">{deal.title}</td>
              <td className="px-6 py-4 whitespace-nowrap">{deal.store}</td>
              <td className="px-6 py-4 whitespace-nowrap">{deal.status}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button 
                  onClick={() => handleDelete(deal.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}