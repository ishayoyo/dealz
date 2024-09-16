import React, { useState } from 'react';
import { VStack, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { login } from '../../utils/auth'; // Changed import

const LoginForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
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
      const data = await login(formData); // Changed function call
      toast({
        title: "Login successful.",
        description: "You've been logged in.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onSubmit(data); // Removed localStorage.setItem
    } catch (error) {
      toast({
        title: "An error occurred.",
        description: error.message || "Unable to login.",
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
          Login
        </Button>
      </VStack>
    </form>
  );
};

export default LoginForm;