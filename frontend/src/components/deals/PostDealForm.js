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
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Image,
  useDisclosure,
  Progress,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const PostDealForm = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    link: '',
    url: '',
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    imageUrl: '',
  });
  const toast = useToast();

  const fallbackImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const getImageUrl = (url) => {
    if (!url) return fallbackImageUrl;
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitLink = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Sending request to fetch image:', formData.link);
      const response = await axios.post('http://localhost:5000/api/v1/deals/fetch-image', 
        { url: formData.link },
        { 
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      console.log('Received response:', response.data);
      const imageUrl = response.data.data.imageUrl;
      if (imageUrl) {
        console.log('Setting image URL:', imageUrl);
        setFormData({ ...formData, imageUrl, url: formData.link });
        setStep(2);
      } else {
        throw new Error('No image URL returned from server');
      }
    } catch (error) {
      console.error('Error in handleSubmitLink:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "An error occurred while fetching the image.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDeal = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/v1/deals', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast({
        title: "Success",
        description: "Deal posted successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setStep(1);
      setFormData({ link: '', url: '', title: '', description: '', price: '', originalPrice: '', category: '', imageUrl: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred while posting the deal.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={onOpen} colorScheme="blue">Post a Deal</Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Post a New Deal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Progress value={step === 1 ? 50 : 100} mb={4} />
            {step === 1 ? (
              <form onSubmit={handleSubmitLink}>
                <FormControl isRequired>
                  <FormLabel>Deal Link</FormLabel>
                  <Input
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder="Enter deal URL"
                  />
                </FormControl>
              </form>
            ) : (
              <form onSubmit={handleSubmitDeal}>
                <VStack spacing={4}>
                  {formData.imageUrl && (
                    <Image 
                      src={getImageUrl(formData.imageUrl)}
                      alt="Deal preview" 
                      maxHeight="200px" 
                      objectFit="contain" 
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        e.target.src = fallbackImageUrl;
                      }}
                      onLoad={() => console.log('Image loaded successfully:', getImageUrl(formData.imageUrl))}
                    />
                  )}
                  <FormControl isRequired>
                    <FormLabel>Deal Title</FormLabel>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter deal title"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the deal"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Price</FormLabel>
                    <Input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Enter price"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Original Price</FormLabel>
                    <Input
                      name="originalPrice"
                      type="number"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      placeholder="Enter original price"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Input
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="Enter category"
                    />
                  </FormControl>
                </VStack>
              </form>
            )}
          </ModalBody>

          <ModalFooter>
            {step === 1 ? (
              <Button colorScheme="blue" onClick={handleSubmitLink} isLoading={isLoading}>
                Next
              </Button>
            ) : (
              <>
                <Button variant="ghost" mr={3} onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button colorScheme="blue" onClick={handleSubmitDeal} isLoading={isLoading}>
                  Post Deal
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PostDealForm;