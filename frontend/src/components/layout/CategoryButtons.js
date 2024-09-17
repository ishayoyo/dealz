import React from 'react';
import { Flex, Button, Icon, useColorModeValue, Box } from '@chakra-ui/react';
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
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box 
      overflowX="auto"
      css={{
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        'scrollbarWidth': 'none',
      }}
      borderBottom="1px" 
      borderColor={borderColor}
      bg={bgColor}
    >
      <Flex 
        justifyContent={["flex-start", "center"]}
        py={2} 
        px={2} 
        maxW="container.xl"
        mx="auto"
      >
        {categories.map((category) => (
          <Button
            key={category.name}
            leftIcon={<Icon as={category.icon} boxSize={4} />}
            mr={2}
            px={3}
            py={1}
            borderRadius="full"
            variant="ghost"
            color={category.color}
            _hover={{ bg: `${category.color}Alpha.100` }}
            _active={{ bg: `${category.color}Alpha.200` }}
            transition="all 0.2s"
            fontSize={["xs", "sm"]}
            fontWeight="medium"
            flexShrink={0}
          >
            {category.name}
          </Button>
        ))}
      </Flex>
    </Box>
  );
};

export default CategoryButtons;