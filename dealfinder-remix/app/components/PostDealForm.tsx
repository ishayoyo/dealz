// app/components/PostDealForm.tsx
import { useState } from "react";
import { Form, useNavigation } from "@remix-run/react";
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
} from "@chakra-ui/react";

export default function PostDealForm() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <>
      <Button onClick={onOpen} colorScheme="blue">Post a Deal</Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <Form method="post" action="/deals/new">
            <ModalHeader>Post a New Deal</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input name="title" placeholder="Enter deal title" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea name="description" placeholder="Describe the deal" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Price</FormLabel>
                  <Input name="price" type="number" placeholder="Enter price" />
                </FormControl>
                <FormControl>
                  <FormLabel>Original Price</FormLabel>
                  <Input name="originalPrice" type="number" placeholder="Enter original price" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Input name="category" placeholder="Enter category" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Deal URL</FormLabel>
                  <Input name="url" type="url" placeholder="Enter deal URL" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Image URL</FormLabel>
                  <Input name="imageUrl" type="url" placeholder="Enter image URL" />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
                Post Deal
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
}