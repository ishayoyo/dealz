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
  Grid,
  GridItem,
  Flex,
  Badge,
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

const Comment = React.memo(({ comment }) => (
  <HStack p={2} backgroundColor="gray.50" borderRadius="md" alignItems="flex-start">
    <Avatar 
      size="sm" 
      src={comment.user?.profilePicture} 
      name={comment.user?.username || 'Anonymous'} 
    />
    <Box>
      <Text fontWeight="bold">{comment.user?.username || 'Anonymous'}</Text>
      <Text>{comment.content}</Text>
      <Text fontSize="xs" color="gray.500">
        {new Date(comment.createdAt).toLocaleString()}
      </Text>
    </Box>
  </HStack>
));

const CommentsList = React.memo(({ comments }) => (
  <VStack align="stretch" maxHeight="200px" overflowY="auto" spacing={2}>
    {comments.map((comment) => (
      <Comment key={comment._id} comment={comment} />
    ))}
  </VStack>
));

const CommentSection = ({ deal, isAuthenticated, user }) => {
  const dispatch = useDispatch();
  const comments = useSelector((state) => selectComments(state, deal?._id));
  const [localComments, setLocalComments] = useState([]);
  const [comment, setComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLocalComments(comments);
    setIsLoading(false);
  }, [comments]);

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
        const newComment = {
          _id: Date.now().toString(), // Temporary ID
          content: comment,
          user: {
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture
          },
          createdAt: new Date().toISOString()
        };

        // Immediately add the new comment to localComments
        setLocalComments(prevComments => [newComment, ...prevComments]);
        setComment('');

        const resultAction = await dispatch(addComment({ dealId: deal._id, content: comment }));
        if (addComment.fulfilled.match(resultAction)) {
          toast({
            title: 'Comment added',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
          // Fetch updated comments to sync with server
          dispatch(fetchComments(deal._id));
        } else if (addComment.rejected.match(resultAction)) {
          // If the comment failed to post, remove it from localComments
          setLocalComments(prevComments => prevComments.filter(c => c._id !== newComment._id));
          throw new Error(resultAction.error.message);
        }
      } catch (error) {
        console.error('Error posting comment:', error);
        toast({
          title: "Error",
          description: `Failed to post comment: ${error.message}`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsCommentLoading(false);
      }
    }
  }, [isAuthenticated, comment, deal, dispatch, toast, user, setLocalComments]);

  const memoizedCommentsList = useMemo(() => (
    <CommentsList comments={localComments} />
  ), [localComments]);

  return (
    <>
      <Text fontWeight="bold" fontSize="lg">Comments ({localComments.length})</Text>
      {isLoading ? (
        <Spinner />
      ) : (
        memoizedCommentsList
      )}
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
    </>
  );
};

const DealModal = ({ isOpen, onClose, deal }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { followedDeals, boughtDeals } = useSelector((state) => state.user);
  const commentsError = useSelector(selectCommentsError);
  const isCommentsLoading = useSelector(selectCommentsLoading);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBoughtLoading, setIsBoughtLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasBought, setHasBought] = useState(false);
  const [followCount, setFollowCount] = useState(deal?.followCount || 0);
  const [boughtCount, setBoughtCount] = useState(deal?.boughtCount || 0);
  const toast = useToast();

  useEffect(() => {
    if (user && deal && followedDeals && boughtDeals) {
      setIsFollowing(followedDeals.includes(deal._id));
      setHasBought(boughtDeals.includes(deal._id));
    }
  }, [user, deal, followedDeals, boughtDeals]);

  useEffect(() => {
    if (isOpen && deal && deal._id) {
      dispatch(fetchComments(deal._id));
    }
  }, [isOpen, deal, dispatch]);

  const fallbackImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const getImageUrl = (url) => {
    if (!url) return fallbackImageUrl;
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  const imageUrl = useMemo(() => getImageUrl(deal?.imageUrl), [deal?.imageUrl]);

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
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent borderRadius="xl" boxShadow="xl" maxHeight="90vh" overflowY="auto">
        <ModalHeader fontWeight="bold" fontSize="2xl">{deal.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
            <GridItem>
              <VStack align="stretch" spacing={6}>
                <Box borderRadius="lg" overflow="hidden" boxShadow="md" height={{ base: "300px", md: "400px", lg: "500px" }}>
                  <Image 
                    src={imageUrl}
                    alt={deal.title}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                    fallbackSrc={fallbackImageUrl}
                  />
                </Box>
                <Flex justifyContent="space-between" alignItems="center">
                  <Badge colorScheme="green" fontSize="lg" p={2}>
                    ${deal.price}
                  </Badge>
                  {deal.originalPrice && (
                    <Text textDecoration="line-through" color="gray.500">
                      Original: ${deal.originalPrice}
                    </Text>
                  )}
                </Flex>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="stretch" spacing={6} height="100%">
                <Text fontSize="md">{deal.description}</Text>
                <Link href={deal.url} isExternal marginTop="auto">
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
                <HStack spacing={4}>
                  <Button 
                    onClick={handleFollow} 
                    colorScheme={isFollowing ? 'pink' : 'gray'}
                    isDisabled={!isAuthenticated || isFollowLoading}
                    isLoading={isFollowLoading}
                    loadingText={isFollowing ? 'Unfollowing...' : 'Following...'}
                    leftIcon={<FaHeart />}
                    flex={1}
                  >
                    {isFollowing ? 'Following' : 'Follow Deal'}
                  </Button>
                  <Button 
                    onClick={handleBought} 
                    colorScheme={hasBought ? 'blue' : 'gray'} 
                    isDisabled={hasBought || !isAuthenticated || isBoughtLoading}
                    isLoading={isBoughtLoading}
                    loadingText="Marking as Bought..."
                    leftIcon={<FaShoppingCart />}
                    flex={1}
                  >
                    {hasBought ? 'Bought' : 'Mark as Bought'}
                  </Button>
                </HStack>
                <Flex justifyContent="space-between">
                  <HStack>
                    <FaUsers />
                    <Text fontSize="sm" fontWeight="bold">
                      {followCount} {followCount === 1 ? 'follower' : 'followers'}
                    </Text>
                  </HStack>
                  <HStack>
                    <FaUsers />
                    <Text fontSize="sm" fontWeight="bold">
                      {boughtCount} {boughtCount === 1 ? 'buyer' : 'buyers'}
                    </Text>
                  </HStack>
                </Flex>
                <Divider />
                <CommentSection deal={deal} isAuthenticated={isAuthenticated} user={user} />
              </VStack>
            </GridItem>
          </Grid>
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