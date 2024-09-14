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
  useDisclosure,
  Progress,
} from '@chakra-ui/react';

const PostDealForm = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    link: '',
    title: '',
    description: '',
    price: '',
    category: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitLink = (e) => {
    e.preventDefault();
    // Here you would typically fetch the information based on the link
    console.log('Fetching information for:', formData.link);
    // For now, we'll just move to the next step
    setStep(2);
  };

  const handleSubmitDeal = (e) => {
    e.preventDefault();
    console.log('Deal submitted:', formData);
    // Add your deal submission logic here
    onClose();
    setStep(1);
    setFormData({ link: '', title: '', description: '', price: '', category: '' });
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
              <Button colorScheme="blue" onClick={handleSubmitLink}>
                Next
              </Button>
            ) : (
              <>
                <Button variant="ghost" mr={3} onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button colorScheme="blue" onClick={handleSubmitDeal}>
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