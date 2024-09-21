import { useState } from 'react';
import { Link } from '@remix-run/react';
import DealModal from './DealModal';

interface DealCardProps {
  id: string;
  title: string;
  imageUrl: string;
  price: string;
  originalPrice: string;
  store: string;
  upvotes: number;
  postedBy: string;
  postedByProfilePic: string;
  description: string;
  followers: number;
  purchases: number;
  dealUrl: string;
}

export default function DealCard({ 
  id, 
  title, 
  imageUrl, 
  price, 
  originalPrice, 
  store, 
  upvotes, 
  postedBy, 
  postedByProfilePic,
  description, 
  followers, 
  purchases, 
  dealUrl 
}: DealCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-2">{store}</p>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-bold text-indigo-600">{price}</span>
              <span className="text-sm text-gray-500 line-through ml-2">{originalPrice}</span>
            </div>
            <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{upvotes} upvotes</span>
          </div>
          <div className="flex items-center mt-2">
            <img src={postedByProfilePic} alt={postedBy} className="w-6 h-6 rounded-full mr-2" />
            <p className="text-xs text-gray-500">Posted by {postedBy}</p>
          </div>
        </div>
      </div>

      <DealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        id={id}
        title={title}
        imageUrl={imageUrl}
        price={price}
        originalPrice={originalPrice}
        store={store}
        upvotes={upvotes}
        postedBy={postedBy}
        postedByProfilePic={postedByProfilePic}
        description={description}
        followers={followers}
        purchases={purchases}
        dealUrl={dealUrl}
      />
    </>
  );
}