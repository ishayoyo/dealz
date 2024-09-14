import React from 'react';
import { Box, Text } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box as="footer" py={4} textAlign="center">
      <Text fontSize="sm" color="gray.500">
        © 2024 DealFinder. All rights reserved.
      </Text>
    </Box>
  );
};

export default Footer;