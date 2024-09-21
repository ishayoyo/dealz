import type { MetaFunction } from "@remix-run/node";
import UserProfile from "~/components/UserProfile";

export const meta: MetaFunction = () => {
  return [
    { title: "User Profile - DealzMix" },
    { name: "description", content: "Edit your DealzMix user profile" },
  ];
};

// Mock user data - in a real app, you'd fetch this from your backend
const mockUser = {
  id: "1",
  username: "DealHunter123",
  email: "dealhunter@example.com",
  firstName: "John",
  lastName: "Doe",
  bio: "I love finding and sharing great deals!",
  avatarUrl: "https://picsum.photos/seed/user1/200",
  dealsPosted: 15,
  dealsFollowed: 30,
  followers: 50,
  following: 25,
};

export default function Profile() {
  return (
    <div className="container mx-auto px-4 py-8">
      <UserProfile initialUser={mockUser} />
    </div>
  );
}