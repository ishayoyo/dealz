import React, { useState } from 'react';
import { Box, Image, Text, VStack, Heading, Badge, HStack, IconButton, useDisclosure } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import DealModal from './DealModal';

const MotionBox = motion(Box);

const DealCard = ({ deal }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <MotionBox
        whileHover={{ y: -5 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={onOpen}
        cursor="pointer"
      >
        <Box
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          boxShadow="md"
          bg="white"
        >
          <Image src={deal.image} alt={deal.title} />
          <VStack align="start" p={4} spacing={2}>
            <Heading size="md" noOfLines={2}>
              {deal.title}
            </Heading>
            <Text fontSize="xl" fontWeight="bold" color="green.500">
              ${deal.price}
            </Text>
            <Text noOfLines={3}>{deal.description}</Text>
            <HStack justifyContent="space-between" width="100%">
              <Badge colorScheme="blue">{deal.category}</Badge>
              <HStack>
                <IconButton
                  aria-label="Upvote"
                  icon={<ChevronUpIcon />}
                  colorScheme="green"
                  variant="ghost"
                  size="sm"
                />
                <Text fontWeight="bold">{deal.votes}</Text>
                <IconButton
                  aria-label="Downvote"
                  icon={<ChevronDownIcon />}
                  colorScheme="red"
                  variant="ghost"
                  size="sm"
                />
              </HStack>
            </HStack>
          </VStack>
        </Box>
      </MotionBox>
      <DealModal isOpen={isOpen} onClose={onClose} deal={deal} />
    </>
  );
};

export default DealCard;