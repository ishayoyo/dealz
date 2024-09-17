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
  Avatar,
} from '@chakra-ui/react';
import { FaFacebook, FaTwitter, FaInstagram, FaExternalLinkAlt, FaHeart, FaShoppingCart, FaComment, FaUsers } from 'react-icons/fa';
import { markDealAsBought, followDeal, unfollowDeal } from '../../utils/api';
import { updateUserDeals } from '../../redux/slices/userSlice';
import axios from 'axios';

const DealModal = ({ isOpen, onClose, deal }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(deal.comments || []);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasBought, setHasBought] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBoughtLoading, setIsBoughtLoading] = useState(false);
  const [boughtCount, setBoughtCount] = useState(deal.boughtCount || 0);
  const [followCount, setFollowCount] = useState(deal.followCount || 0);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user && deal) {
      setIsFollowing(user.followedDeals.includes(deal._id));
      setHasBought(user.boughtDeals.includes(deal._id));
    }
  }, [user, deal]);

  useEffect(() => {
    fetchComments();
  }, [deal._id]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/deals/${deal._id}/comments`);
      setComments(response.data.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch comments. Please try again.",
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

  const handleCommentSubmit = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to post comments.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (comment.trim()) {
      setIsCommentLoading(true);
      try {
        const response = await axios.post(`http://localhost:5000/api/v1/deals/${deal._id}/comments`, {
          content: comment
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setComments([...comments, response.data.data.comment]);
        setComment('');
        toast({
          title: 'Comment added',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error posting comment:', error);
        toast({
          title: "Error",
          description: "Failed to post comment. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsCommentLoading(false);
      }
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
        setFollowCount(prevCount => prevCount - 1);
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
        setFollowCount(prevCount => prevCount + 1);
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
      setBoughtCount(prevCount => prevCount + 1);
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
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent borderRadius="xl" boxShadow="xl">
        <ModalHeader fontWeight="bold" fontSize="2xl">{deal.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={6}>
            <Box borderRadius="lg" overflow="hidden" boxShadow="md" height="300px">
              <Image 
                src={getImageUrl(deal.imageUrl)}
                alt={deal.title}
                objectFit="contain"
                width="100%"
                height="100%"
                fallbackSrc={fallbackImageUrl}
              />
            </Box>
            <Link href={deal.url} isExternal>
              <Button 
                colorScheme="green" 
                size="lg" 
                width="100%" 
                rightIcon={<FaExternalLinkAlt />}
                fontWeight="bold"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                Grab This Deal Now!
              </Button>
            </Link>
            <Text fontSize="md">{deal.description}</Text>
            <HStack justifyContent="space-between" backgroundColor="gray.100" p={3} borderRadius="md">
              <Text fontWeight="bold" fontSize="xl">Price: ${deal.price}</Text>
              {deal.originalPrice && (
                <Text textDecoration="line-through" color="gray.500">
                  Original: ${deal.originalPrice}
                </Text>
              )}
            </HStack>
            <HStack spacing={4}>
              <VStack flex={1} spacing={1}>
                <Button 
                  onClick={handleFollow} 
                  colorScheme={isFollowing ? 'pink' : 'gray'}
                  isDisabled={!isAuthenticated || isFollowLoading}
                  isLoading={isFollowLoading}
                  loadingText={isFollowing ? 'Unfollowing...' : 'Following...'}
                  leftIcon={<FaHeart />}
                  width="100%"
                >
                  {isFollowing ? 'Following' : 'Follow Deal'}
                </Button>
                <HStack 
                  justifyContent="center" 
                  backgroundColor="pink.100" 
                  borderRadius="md" 
                  py={1} 
                  px={3}
                  width="100%"
                >
                  <FaUsers />
                  <Text fontSize="sm" fontWeight="bold">
                    {followCount} {followCount === 1 ? 'follower' : 'followers'}
                  </Text>
                </HStack>
              </VStack>
              <VStack flex={1} spacing={1}>
                <Button 
                  onClick={handleBought} 
                  colorScheme={hasBought ? 'blue' : 'gray'} 
                  isDisabled={hasBought || !isAuthenticated || isBoughtLoading}
                  isLoading={isBoughtLoading}
                  loadingText="Marking as Bought..."
                  leftIcon={<FaShoppingCart />}
                  width="100%"
                >
                  {hasBought ? 'Bought' : 'Mark as Bought'}
                </Button>
                <HStack 
                  justifyContent="center" 
                  backgroundColor="blue.100" 
                  borderRadius="md" 
                  py={1} 
                  px={3}
                  width="100%"
                >
                  <FaUsers />
                  <Text fontSize="sm" fontWeight="bold">
                    {boughtCount} {boughtCount === 1 ? 'buyer' : 'buyers'}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
            <Divider />
            <Text fontWeight="bold" fontSize="lg">Comments</Text>
            <VStack align="stretch" maxHeight="200px" overflowY="auto" spacing={2}>
              {comments.map((c) => (
                <HStack key={c._id} p={2} backgroundColor="gray.50" borderRadius="md" alignItems="flex-start">
                  <Avatar size="sm" src={c.user.profilePicture} name={c.user.username} />
                  <Box>
                    <Text fontWeight="bold">{c.user.username}</Text>
                    <Text>{c.content}</Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              resize="none"
            />
            <Button 
              onClick={handleCommentSubmit} 
              colorScheme="blue"
              leftIcon={<FaComment />}
              isLoading={isCommentLoading}
              loadingText="Posting..."
              isDisabled={!isAuthenticated || isCommentLoading}
            >
              Post Comment
            </Button>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={2}>
            <Text fontWeight="bold">Share:</Text>
            <IconButton
              icon={<FaFacebook />}
              onClick={() => handleShare('Facebook')}
              aria-label="Share on Facebook"
              colorScheme="facebook"
              variant="outline"
            />
            <IconButton
              icon={<FaTwitter />}
              onClick={() => handleShare('Twitter')}
              aria-label="Share on Twitter"
              colorScheme="twitter"
              variant="outline"
            />
            <IconButton
              icon={<FaInstagram />}
              onClick={() => handleShare('Instagram')}
              aria-label="Share on Instagram"
              colorScheme="pink"
              variant="outline"
            />
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DealModal;