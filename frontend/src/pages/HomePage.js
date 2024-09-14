import React from 'react';
import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import DealGrid from '../components/deals/DealGrid';

const MotionBox = motion(Box);

const dummyDeals = [
  { id: 1, title: 'Smartphone X', description: 'Latest model with advanced features', price: 599.99, image: 'https://via.placeholder.com/300', category: 'Electronics', votes: 15 },
  { id: 2, title: 'Running Shoes', description: 'Comfortable shoes for your daily run', price: 89.99, image: 'https://via.placeholder.com/300', category: 'Sports', votes: 8 },
  { id: 3, title: 'Coffee Maker', description: 'Start your day with perfect coffee', price: 49.99, image: 'https://via.placeholder.com/300', category: 'Home & Kitchen', votes: 12 },
  { id: 4, title: 'Wireless Earbuds', description: 'Crystal clear audio on the go', price: 129.99, image: 'https://via.placeholder.com/300', category: 'Electronics', votes: 20 },
  { id: 5, title: 'Yoga Mat', description: 'Premium mat for your yoga practice', price: 29.99, image: 'https://via.placeholder.com/300', category: 'Fitness', votes: 6 },
  { id: 6, title: 'Smartwatch', description: 'Track your fitness and stay connected', price: 199.99, image: 'https://via.placeholder.com/300', category: 'Electronics', votes: 18 },
  { id: 7, title: 'Blender', description: 'Make smoothies and more with ease', price: 39.99, image: 'https://via.placeholder.com/300', category: 'Home & Kitchen', votes: 9 },
  { id: 8, title: 'Backpack', description: 'Durable and spacious for all your needs', price: 59.99, image: 'https://via.placeholder.com/300', category: 'Travel', votes: 11 },
];

const HomePage = () => {
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <DealGrid deals={dummyDeals} />
    </MotionBox>
  );
};

export default HomePage;