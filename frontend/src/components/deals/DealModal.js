import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { fetchComments, addComment } from '../../redux/slices/dealSlice';
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
  Spinner,
} from '@chakra-ui/react';
import { FaFacebook, FaTwitter, FaInstagram, FaExternalLinkAlt, FaHeart, FaShoppingCart, FaComment, FaUsers } from 'react-icons/fa';
import { markDealAsBought, followDeal, unfollowDeal } from '../../utils/api';
import { updateUserDeals } from '../../redux/slices/userSlice';

const selectComments = createSelector(
  [(state) => state.deals.comments, (_, dealId) => dealId],
  (comments, dealId) => comments[dealId] || []
);

const selectCommentsError = (state) => state.deals.error;
const selectCommentsLoading = (state) => state.deals.loading;

const DealModal = ({ isOpen, onClose, deal }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { followedDeals, boughtDeals } = useSelector((state) => state.user);
  const comments = useSelector((state) => selectComments(state, deal?._id));
  const commentsError = useSelector(selectCommentsError);
  const isCommentsLoading = useSelector(selectCommentsLoading);
  const [comment, setComment] = useState('');
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBoughtLoading, setIsBoughtLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasBought, setHasBought] = useState(false);
  const [followCount, setFollowCount] = useState(deal?.followCount || 0);
  const [boughtCount, setBoughtCount] = useState(deal?.boughtCount || 0);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user && deal && followedDeals && boughtDeals) {
      setIsFollowing(followedDeals.includes(deal._id));
      setHasBought(boughtDeals.includes(deal._id));
    }
  }, [user, deal, followedDeals, boughtDeals]);

  useEffect(() => {
    if (deal && deal._id && isOpen) {
      dispatch(fetchComments(deal._id))
        .unwrap()
        .then(() => {
          console.log('Comments fetched successfully');
        })
        .catch((error) => {
          console.error('Error fetching comments:', error);
          toast({
            title: "Error",
            description: `Failed to fetch comments: ${error.message}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        });
    }
  }, [dispatch, deal, isOpen, toast]);

  const fallbackImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const getImageUrl = (url) => {
    if (!url) return fallbackImageUrl;
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  const imageUrl = useMemo(() => getImageUrl(deal?.imageUrl), [deal?.imageUrl]);

  const handleCommentSubmit = useCallback(async () => {
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
        await dispatch(addComment({ dealId: deal._id, content: comment })).unwrap();
        setComment('');
        dispatch(fetchComments(deal._id));
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
  }, [isAuthenticated, comment, deal, dispatch, toast]);

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
        const result = await unfollowDeal(deal._id);
        dispatch(updateUserDeals({ dealId: deal._id, action: 'unfollow' }));
        setIsFollowing(false);
        setFollowCount(result.data.followCount);
        toast({
          title: "Deal unfollowed",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        const result = await followDeal(deal._id);
        dispatch(updateUserDeals({ dealId: deal._id, action: 'follow' }));
        setIsFollowing(true);
        setFollowCount(result.data.followCount);
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
        description: error.message || "Failed to update follow status. Please try again.",
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
      const result = await markDealAsBought(deal._id);
      dispatch(updateUserDeals({ dealId: deal._id, action: 'bought' }));
      setHasBought(true);
      setBoughtCount(result.data.boughtCount);
      toast({
        title: "Marked as bought",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark deal as bought. Please try again.",
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

  if (!deal) {
    return null;
  }

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
                src={imageUrl}
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
            <Text fontWeight="bold" fontSize="lg">Comments ({comments.length})</Text>
            <VStack align="stretch" maxHeight="200px" overflowY="auto" spacing={2}>
              {isCommentsLoading ? (
                <Spinner />
              ) : commentsError ? (
                <Text color="red.500">Error loading comments: {commentsError}</Text>
              ) : comments && comments.length > 0 ? (
                comments.map((c) => (
                  <HStack key={c.id || c._id} p={2} backgroundColor="gray.50" borderRadius="md" alignItems="flex-start">
                    <Avatar 
                      size="sm" 
                      src={c.user?.profilePicture} 
                      name={c.user?.username || 'Anonymous'} 
                    />
                    <Box>
                      <Text fontWeight="bold">{c.user?.username || 'Anonymous'}</Text>
                      <Text>{c.content}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(c.createdAt).toLocaleString()}
                      </Text>
                    </Box>
                  </HStack>
                ))
              ) : (
                <Text>No comments yet. Be the first to comment!</Text>
              )}
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

export default React.memo(DealModal);