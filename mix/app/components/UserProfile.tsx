import { useState } from 'react';
import { Link } from '@remix-run/react';
import DealCard from './DealCard';

interface UserProfileProps {
  initialUser: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    bio: string;
    avatarUrl: string;
    dealsPosted: number;
    dealsFollowed: number;
    followers: number;
    following: number;
  };
}

// Mock data for posted deals, followed deals, followers, and following
const postedDeals = [
  { id: "1", title: "50% off on Amazon Echo Dot", imageUrl: "https://picsum.photos/seed/1/300/200", price: "$24.99", originalPrice: "$49.99", store: "Amazon", upvotes: 120, description: "Get the latest Amazon Echo Dot at half price! Limited time offer.", followers: 45, purchases: 78, dealUrl: "https://www.amazon.com/echo-dot-deal", postedBy: "DealHunter123" },
  { id: "2", title: "Buy one, get one free at Starbucks", imageUrl: "https://picsum.photos/seed/2/300/200", price: "BOGO", originalPrice: "", store: "Starbucks", upvotes: 85, description: "Buy any grande beverage and get one free!", followers: 30, purchases: 50, dealUrl: "https://www.starbucks.com/promo", postedBy: "CoffeeAddict" },
];

const followedDeals = [
  { id: "3", title: "70% off select Nike shoes", imageUrl: "https://picsum.photos/seed/3/300/200", price: "From $39.99", originalPrice: "$129.99", store: "Nike", upvotes: 200, description: "Huge discounts on select Nike shoes! Don't miss out.", followers: 80, purchases: 120, dealUrl: "https://www.nike.com/deals", postedBy: "SneakerFreak" },
  { id: "4", title: "Free shipping on orders over $50", imageUrl: "https://picsum.photos/seed/4/300/200", price: "Free Shipping", originalPrice: "", store: "Best Buy", upvotes: 65, description: "Get free shipping on all orders over $50 at Best Buy.", followers: 25, purchases: 40, dealUrl: "https://www.bestbuy.com/freeshipping", postedBy: "TechDeals" },
];

const followersList = [
  { id: "1", username: "DealFan1", avatarUrl: "https://picsum.photos/seed/user1/100" },
  { id: "2", username: "BargainHunter", avatarUrl: "https://picsum.photos/seed/user2/100" },
];

const followingList = [
  { id: "1", username: "SuperSaver", avatarUrl: "https://picsum.photos/seed/user3/100" },
  { id: "2", username: "DiscountQueen", avatarUrl: "https://picsum.photos/seed/user4/100" },
];

export default function UserProfile({ initialUser }: UserProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('postedDeals');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser(prevUser => ({ ...prevUser, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prevUser => ({ ...prevUser, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the updated user data to your backend
    console.log('Updated user:', user);
    if (newPassword && newPassword === confirmPassword) {
      console.log('New password:', newPassword);
    }
    setIsEditing(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 mb-6 md:mb-0">
          <img src={user.avatarUrl} alt={user.username} className="w-32 h-32 rounded-full mx-auto mb-4" />
          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          )}
          <h3 className="text-xl font-semibold text-center mb-2">{user.username}</h3>
          <p className="text-gray-600 text-center mb-4">{user.email}</p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span>{user.dealsPosted} deals</span>
            <span>{user.followers} followers</span>
            <span>{user.following} following</span>
          </div>
        </div>

        <div className="md:w-2/3 md:pl-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={user.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={user.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={user.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              ></textarea>
            </div>
            {isEditing && (
              <>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
              </>
            )}
            {isEditing && (
              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                Save Changes
              </button>
            )}
          </form>

          <div className="mt-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {['postedDeals', 'followedDeals', 'followers', 'following'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {tab === 'postedDeals' ? 'Posted Deals' : tab === 'followedDeals' ? 'Followed Deals' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-4">
              {activeTab === 'postedDeals' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {postedDeals.map(deal => (
                    <DealCard key={deal.id} {...deal} />
                  ))}
                </div>
              )}
              {activeTab === 'followedDeals' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {followedDeals.map(deal => (
                    <DealCard key={deal.id} {...deal} />
                  ))}
                </div>
              )}
              {activeTab === 'followers' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {followersList.map(follower => (
                    <Link key={follower.id} to={`/user/${follower.id}`} className="flex flex-col items-center">
                      <img src={follower.avatarUrl} alt={follower.username} className="w-16 h-16 rounded-full mb-2" />
                      <span className="text-sm text-gray-700">{follower.username}</span>
                    </Link>
                  ))}
                </div>
              )}
              {activeTab === 'following' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {followingList.map(following => (
                    <Link key={following.id} to={`/user/${following.id}`} className="flex flex-col items-center">
                      <img src={following.avatarUrl} alt={following.username} className="w-16 h-16 rounded-full mb-2" />
                      <span className="text-sm text-gray-700">{following.username}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}