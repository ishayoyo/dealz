// src/pages/ErrorPage.js
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Box, Heading, Text, Button } from '@chakra-ui/react';

const ErrorPage = () => {
  const location = useLocation();
  const { message } = location.state || {};

  return (
    <Box textAlign="center" py={10} px={6}>
      <Heading display="inline-block" as="h2" size="2xl" bgGradient="linear(to-r, teal.400, teal.600)" backgroundClip="text">
        Error
      </Heading>
      <Text fontSize="18px" mt={3} mb={2}>
        {message || 'An unexpected error occurred.'}
      </Text>
      <Text color={'gray.500'} mb={6}>
        Please try again or return to the homepage.
      </Text>

      <Button
        as={Link}
        to="/"
        colorScheme="teal"
        bgGradient="linear(to-r, teal.400, teal.500, teal.600)"
        color="white"
        variant="solid"
      >
        Go to Home
      </Button>
    </Box>
  );
};

export default ErrorPage;