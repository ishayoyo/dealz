import React from 'react';
import { Flex, Button, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { FaLaptop, FaTshirt, FaHome, FaUtensils, FaPlane, FaGamepad, FaBook, FaDumbbell } from 'react-icons/fa';

const categories = [
  { name: 'Electronics', icon: FaLaptop, color: 'blue.400' },
  { name: 'Fashion', icon: FaTshirt, color: 'pink.400' },
  { name: 'Home', icon: FaHome, color: 'green.400' },
  { name: 'Food', icon: FaUtensils, color: 'orange.400' },
  { name: 'Travel', icon: FaPlane, color: 'purple.400' },
  { name: 'Gaming', icon: FaGamepad, color: 'red.400' },
  { name: 'Books', icon: FaBook, color: 'yellow.400' },
  { name: 'Fitness', icon: FaDumbbell, color: 'teal.400' },
];

const CategoryButtons = () => {
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  return (
    <Flex justifyContent="center" py={4} px={2}>
      <Flex
        maxW="container.md"
        overflowX="auto"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          'scrollbarWidth': 'none',
        }}
      >
        {categories.map((category) => (
          <Button
            key={category.name}
            leftIcon={<Icon as={category.icon} boxSize={5} />}
            mr={2}
            mb={2}
            px={4}
            py={2}
            borderRadius="md" // Changed from "full" to "md" for less rounded edges
            bg={bgColor}
            color={textColor}
            _hover={{ bg: category.color, color: 'white' }}
            transition="all 0.2s"
            fontSize="sm"
            fontWeight="medium"
          >
            {category.name}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
};

export default CategoryButtons;