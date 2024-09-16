import React, { useState } from 'react';
import { VStack, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { signup } from '../../utils/auth'; // Changed from registerUser to signup

const SignupForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await signup(formData); // Changed from registerUser to signup
      toast({
        title: "Account created.",
        description: "We've created your account for you.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onSubmit(data);
    } catch (error) {
      toast({
        title: "An error occurred.",
        description: error.message || "Unable to create account.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Username</FormLabel>
          <Input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
          />
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={isLoading}>
          Sign Up
        </Button>
      </VStack>
    </form>
  );
};

export default SignupForm;