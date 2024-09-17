import React from 'react';
import { Box, Image, Text, VStack, Heading, Badge, HStack, IconButton, useDisclosure, useToast, Tooltip } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import DealModal from './DealModal';
import { voteDeal } from '../../utils/api';

const MotionBox = motion(Box);

const DealCard = ({ deal, isAuthenticated, onVote }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleVote = async (e, value) => {
    e.stopPropagation(); // Prevent opening the modal
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on deals.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await voteDeal(deal._id, value);
      onVote(deal._id, response.data.voteCount);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to vote on the deal. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fallbackImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const getImageUrl = (url) => {
    if (!url) return fallbackImageUrl;
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  const handleImageError = (e) => {
    e.target.src = fallbackImageUrl;
  };

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
          width="100%"
        >
          <Box height="200px" position="relative" overflow="hidden">
            <Image 
              src={getImageUrl(deal.imageUrl)}
              alt={deal.title}
              objectFit="cover"
              width="100%"
              height="100%"
              fallbackSrc={fallbackImageUrl}
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              loading="lazy"
              onError={handleImageError}
            />
          </Box>
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
                <Tooltip label="Upvote" aria-label="Upvote">
                  <IconButton
                    aria-label="Upvote"
                    icon={<ChevronUpIcon />}
                    colorScheme="green"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleVote(e, 1)}
                  />
                </Tooltip>
                <Text fontWeight="bold">{deal.voteCount}</Text>
                <Tooltip label="Downvote" aria-label="Downvote">
                  <IconButton
                    aria-label="Downvote"
                    icon={<ChevronDownIcon />}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleVote(e, -1)}
                  />
                </Tooltip>
              </HStack>
            </HStack>
          </VStack>
        </Box>
      </MotionBox>
      <DealModal isOpen={isOpen} onClose={onClose} deal={deal} isAuthenticated={isAuthenticated} />
    </>
  );
};

export default DealCard;