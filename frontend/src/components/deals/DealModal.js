import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  Textarea,
  useToast,
  Divider,
  IconButton,
  Image,
  Box,
  Link,
} from '@chakra-ui/react';
import { FaFacebook, FaTwitter, FaInstagram, FaExternalLinkAlt } from 'react-icons/fa';
import { markDealAsBought, followDeal, unfollowDeal } from '../../utils/api';
import { updateUserDeals } from '../../redux/slices/userSlice';

const DealModal = ({ isOpen, onClose, deal }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(deal.comments || []);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasBought, setHasBought] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBoughtLoading, setIsBoughtLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user && deal) {
      setIsFollowing(user.followedDeals.includes(deal._id));
      setHasBought(user.boughtDeals.includes(deal._id));
    }
  }, [user, deal]);

  const fallbackImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const getImageUrl = (url) => {
    if (!url) return fallbackImageUrl;
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

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

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow deals.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowDeal(deal._id);
        dispatch(updateUserDeals({ dealId: deal._id, action: 'unfollow' }));
        setIsFollowing(false);
        toast({
          title: "Deal unfollowed",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        await followDeal(deal._id);
        dispatch(updateUserDeals({ dealId: deal._id, action: 'follow' }));
        setIsFollowing(true);
        toast({
          title: "Deal followed",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBought = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to mark deals as bought.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsBoughtLoading(true);
    try {
      await markDealAsBought(deal._id);
      dispatch(updateUserDeals({ dealId: deal._id, action: 'bought' }));
      setHasBought(true);
      toast({
        title: "Marked as bought",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark deal as bought. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsBoughtLoading(false);
    }
  };

  const handleShare = (platform) => {
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
            <Box borderRadius="md" overflow="hidden">
              <Image 
                src={getImageUrl(deal.imageUrl)}
                alt={deal.title}
                objectFit="cover"
                width="100%"
                height="300px"
                fallbackSrc={fallbackImageUrl}
              />
            </Box>
            <Link href={deal.url} isExternal>
              <Button 
                colorScheme="green" 
                size="lg" 
                width="100%" 
                rightIcon={<FaExternalLinkAlt />}
              >
                Grab This Deal Now!
              </Button>
            </Link>
            <Text>{deal.description}</Text>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold">Price: ${deal.price}</Text>
              {deal.originalPrice && (
                <Text textDecoration="line-through" color="gray.500">
                  Original: ${deal.originalPrice}
                </Text>
              )}
            </HStack>
            <HStack>
              <Button 
                onClick={handleFollow} 
                colorScheme={isFollowing ? 'green' : 'gray'}
                isDisabled={!isAuthenticated || isFollowLoading}
                isLoading={isFollowLoading}
                loadingText={isFollowing ? 'Unfollowing...' : 'Following...'}
              >
                {isFollowing ? 'Following' : 'Follow Deal'}
              </Button>
              <Button 
                onClick={handleBought} 
                colorScheme={hasBought ? 'blue' : 'gray'} 
                isDisabled={hasBought || !isAuthenticated || isBoughtLoading}
                isLoading={isBoughtLoading}
                loadingText="Marking as Bought..."
              >
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