export interface Deal {
    _id: string;
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    isFollowing?: boolean;
  }