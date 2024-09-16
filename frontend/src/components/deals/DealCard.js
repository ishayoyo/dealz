import React from 'react';
import { Box, Image, Text, VStack, Heading, Badge, HStack, IconButton, useDisclosure, AspectRatio } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import DealModal from './DealModal';

const MotionBox = motion(Box);

const DealCard = ({ deal }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fallbackImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const getImageUrl = (url) => {
    if (!url) return fallbackImageUrl;
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  console.log('Deal image URL:', deal.imageUrl);

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
          <AspectRatio ratio={16 / 9}>
            <Image 
              src={getImageUrl(deal.imageUrl)}
              alt={deal.title}
              objectFit="cover"
              width="100%"
              height="100%"
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                e.target.src = fallbackImageUrl;
              }}
              onLoad={() => console.log('Image loaded successfully:', getImageUrl(deal.imageUrl))}
            />
          </AspectRatio>
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