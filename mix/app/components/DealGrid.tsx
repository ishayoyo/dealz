import DealCard from "./DealCard";

// Mock data for demonstration
const deals = [
  { 
    id: "1", 
    title: "50% off on Amazon Echo Dot", 
    imageUrl: "https://picsum.photos/seed/1/300/200", 
    price: "$24.99",
    originalPrice: "$49.99",
    store: "Amazon", 
    upvotes: 120,
    postedBy: "DealHunter123",
    postedByProfilePic: "https://picsum.photos/seed/user1/100/100",
    description: "Get the latest Amazon Echo Dot at half price! Limited time offer.",
    followers: 45,
    purchases: 78,
    dealUrl: "https://www.amazon.com/echo-dot-deal"
  },
  // Add more deals here with the postedByProfilePic property
];

export default function DealGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {deals.map((deal) => (
        <DealCard key={deal.id} {...deal} />
      ))}
    </div>
  );
}