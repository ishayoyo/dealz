import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDealById } from '../redux/slices/dealSlice';
import { Box, Heading, Text, Spinner } from '@chakra-ui/react';

const DealPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentDeal, loading, error } = useSelector((state) => state.deals);

  useEffect(() => {
    dispatch(fetchDealById(id));
  }, [dispatch, id]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  if (!currentDeal) {
    return <Text>Deal not found</Text>;
  }

  return (
    <Box className="deal-page">
      <Heading>Deal Details</Heading>
      <Text>Title: {currentDeal.title}</Text>
      <Text>Price: ${currentDeal.price}</Text>
      <Text>Description: {currentDeal.description}</Text>
      {/* Add more deal details as needed */}
    </Box>
  );
};

export default DealPage;