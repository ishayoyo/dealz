import React from 'react';
import { SimpleGrid, Container } from '@chakra-ui/react';
import DealCard from './DealCard';

const DealGrid = ({ deals, isAuthenticated, onVote }) => {
  return (
    <Container maxW="container.xl" py={8}>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
        {deals.map((deal) => (
          <DealCard 
            key={deal._id} 
            deal={deal} 
            isAuthenticated={isAuthenticated}
            onVote={onVote}
          />
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default DealGrid;