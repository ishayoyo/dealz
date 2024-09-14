import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  Textarea,
  useToast,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

const DealModal = ({ isOpen, onClose, deal }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(deal.comments || []);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasBought, setHasBought] = useState(false);
  const toast = useToast();

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      setComments([...comments, { text: comment, user: 'Current User' }]);
      setComment('');
      toast({
        title: 'Comment added',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? 'Unfollowed deal' : 'Following deal',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleBought = () => {
    setHasBought(true);
    toast({
      title: 'Marked as bought',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleShare = (platform) => {
    // Implement sharing logic here
    console.log(`Sharing on ${platform}`);
    toast({
      title: `Shared on ${platform}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader>{deal.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text>{deal.description}</Text>
            <Text fontWeight="bold">Price: ${deal.price}</Text>
            <HStack>
              <Button onClick={handleFollow} colorScheme={isFollowing ? 'green' : 'gray'}>
                {isFollowing ? 'Following' : 'Follow Deal'}
              </Button>
              <Button onClick={handleBought} colorScheme={hasBought ? 'blue' : 'gray'} isDisabled={hasBought}>
                {hasBought ? 'Bought' : 'Mark as Bought'}
              </Button>
            </HStack>
            <Divider />
            <Text fontWeight="bold">Comments</Text>
            <VStack align="stretch" maxHeight="200px" overflowY="auto">
              {comments.map((c, index) => (
                <Text key={index}>
                  <strong>{c.user}:</strong> {c.text}
                </Text>
              ))}
            </VStack>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <Button onClick={handleCommentSubmit} colorScheme="blue">
              Post Comment
            </Button>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={2}>
            <Text>Share:</Text>
            <IconButton
              icon={<FaFacebook />}
              onClick={() => handleShare('Facebook')}
              aria-label="Share on Facebook"
            />
            <IconButton
              icon={<FaTwitter />}
              onClick={() => handleShare('Twitter')}
              aria-label="Share on Twitter"
            />
            <IconButton
              icon={<FaInstagram />}
              onClick={() => handleShare('Instagram')}
              aria-label="Share on Instagram"
            />
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DealModal;