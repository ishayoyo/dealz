import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDealById, fetchComments } from '../redux/slices/dealSlice';
import { Box, Heading, Text, Spinner, VStack, Image } from '@chakra-ui/react';

const DealPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentDeal, loading, error } = useSelector((state) => state.deals);
  const comments = useSelector((state) => state.deals.comments[id] || []);

  useEffect(() => {
    dispatch(fetchDealById(id));
    dispatch(fetchComments(id));
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
      <VStack spacing={4} align="stretch">
        <Heading>Deal Details</Heading>
        <Image src={currentDeal.imageUrl} alt={currentDeal.title} maxW="300px" />
        <Text><strong>Title:</strong> {currentDeal.title}</Text>
        <Text><strong>Price:</strong> ${currentDeal.price}</Text>
        <Text><strong>Description:</strong> {currentDeal.description}</Text>
        <Heading size="md">Comments</Heading>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <Box key={comment._id} p={2} bg="gray.100" borderRadius="md">
              <Text><strong>{comment.user?.username || 'Anonymous'}:</strong> {comment.content}</Text>
            </Box>
          ))
        ) : (
          <Text>No comments yet.</Text>
        )}
      </VStack>
    </Box>
  );
};

export default DealPage;