import React, { useState, useEffect } from 'react';
import { Box, Spinner, Center, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import DealGrid from '../components/deals/DealGrid';
import { fetchDeals } from '../utils/api';
import { isAuthenticated as checkIsAuthenticated } from '../utils/auth';

const MotionBox = motion(Box);

const HomePage = () => {
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(checkIsAuthenticated());
    const getDeals = async () => {
      try {
        setIsLoading(true);
        const fetchedDeals = await fetchDeals();
        if (Array.isArray(fetchedDeals.data.deals)) {
          setDeals(fetchedDeals.data.deals);
        } else {
          throw new Error('Invalid deals data received');
        }
      } catch (err) {
        setError('Failed to fetch deals. Please try again later.');
        console.error('Error fetching deals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getDeals();
  }, []);

  const handleVote = (dealId, newVoteCount) => {
    setDeals(deals.map(deal => 
      deal._id === dealId ? { ...deal, voteCount: newVoteCount } : deal
    ));
  };

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box p={4}>
        {isLoading ? (
          <Center h="50vh">
            <Spinner size="xl" />
          </Center>
        ) : error ? (
          <Center h="50vh">
            <Text textAlign="center" color="red.500">{error}</Text>
          </Center>
        ) : deals.length > 0 ? (
          <DealGrid 
            deals={deals} 
            isAuthenticated={isAuthenticated} 
            onVote={handleVote}
          />
        ) : (
          <Center h="50vh">
            <Text textAlign="center">No deals available at the moment.</Text>
          </Center>
        )}
      </Box>
    </MotionBox>
  );
};

export default HomePage;