import React, { useState } from 'react';
import { Link } from '@remix-run/react';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
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

interface Comment {
  id: string;
  user: string;
  userProfilePic: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

export default function DealModal({
  isOpen,
  onClose,
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
}: DealModalProps) {
  const [isFollowingDeal, setIsFollowingDeal] = useState(false);
  const [userUpvote, setUserUpvote] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleFollowDeal = () => setIsFollowingDeal(!isFollowingDeal);
  const handleVote = (vote: number) => setUserUpvote(userUpvote === vote ? 0 : vote);
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Comment submitted:', comment);
    setComment('');
  };

  const discount = Math.round((1 - parseFloat(price.replace('$', '')) / parseFloat(originalPrice.replace('$', ''))) * 100);

  // Fake comments data
  const fakeComments: Comment[] = [
    {
      id: '1',
      user: 'DealFinder42',
      userProfilePic: 'https://picsum.photos/seed/user1/50/50',
      content: "Great deal! I just bought one and it works perfectly.",
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      user: 'BargainHunter',
      userProfilePic: 'https://picsum.photos/seed/user2/50/50',
      content: "Has anyone used this before? Is it worth the price?",
      timestamp: '1 hour ago',
      replies: [
        {
          id: '2-1',
          user: 'TechExpert',
          userProfilePic: 'https://picsum.photos/seed/user3/50/50',
          content: "I've been using it for a month now. Definitely worth it at this price!",
          timestamp: '30 minutes ago',
        },
      ],
    },
    {
      id: '3',
      user: 'SavvyShopper',
      userProfilePic: 'https://picsum.photos/seed/user4/50/50',
      content: "Thanks for sharing! Just ordered mine.",
      timestamp: '45 minutes ago',
    },
    {
      id: '4',
      user: 'FrugalFred',
      userProfilePic: 'https://picsum.photos/seed/user5/50/50',
      content: "Does anyone know how long this deal will last?",
      timestamp: '20 minutes ago',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-auto my-8 flex flex-col lg:flex-row">
        {/* Left Column - Image and CTA */}
        <div className="lg:w-2/5 relative">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none" />
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-lg">
            {discount}% OFF
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-4xl font-bold text-white">{price}</span>
                <span className="text-lg text-gray-300 line-through ml-2">{originalPrice}</span>
              </div>
              <button 
                className="bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold"
                onClick={() => window.open(dealUrl, '_blank')}
              >
                Get This Deal
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="lg:w-3/5 p-6 lg:p-8 overflow-y-auto max-h-[80vh] bg-white rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
            <h2 className="text-2xl lg:text-3xl font-bold mb-3 lg:mb-0 text-gray-800">{title}</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {purchases} bought
              </span>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleVote(1)}
                  className={`p-1 rounded ${userUpvote === 1 ? 'text-blue-500' : 'text-gray-400'}`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="font-semibold text-gray-700">{upvotes}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img src={postedByProfilePic} alt={postedBy} className="w-10 h-10 rounded-full mr-3" />
              <span className="text-sm text-gray-600">Posted by <span className="font-semibold">{postedBy}</span></span>
            </div>
            <button 
              onClick={handleFollowDeal}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                isFollowingDeal ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'
              } transition-colors`}
            >
              {isFollowingDeal ? 'Following Deal' : 'Follow Deal'}
            </button>
          </div>

          <p className="text-gray-600 mb-4">{description}</p>

          <div className="text-gray-600 text-sm mb-6">
            Available at: <a href={dealUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{store}</a>
          </div>

          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Leave a comment..."
            ></textarea>
            <button 
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Post Comment
            </button>
          </form>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Comments</h3>
            {fakeComments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-4">
                <div className="flex items-start space-x-3">
                  <img src={comment.userProfilePic} alt={comment.user} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">{comment.user}</span>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{comment.content}</p>
                    {comment.replies && (
                      <div className="mt-3 ml-6 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-3">
                            <img src={reply.userProfilePic} alt={reply.user} className="w-6 h-6 rounded-full" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-800">{reply.user}</span>
                                <span className="text-xs text-gray-500">{reply.timestamp}</span>
                              </div>
                              <p className="text-gray-600 mt-1">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}