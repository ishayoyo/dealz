import React, { useState } from 'react';
<<<<<<< HEAD
import { VStack, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { loginUser } from '../../utils/api';
=======
import { useNavigate } from 'react-router-dom';
import { Box, VStack, FormControl, FormLabel, Input, Button, Heading, useToast } from '@chakra-ui/react';
import { login } from '../../utils/auth';
>>>>>>> origin/master

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
<<<<<<< HEAD
  const [isLoading, setIsLoading] = useState(false);
=======
  const navigate = useNavigate();
>>>>>>> origin/master
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    setIsLoading(true);
    try {
      const data = await loginUser(formData);
      toast({
        title: "Login successful.",
        description: "You've been logged in.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      localStorage.setItem('token', data.token);
      onSubmit(data);
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
=======
    try {
      const data = await login(formData);
      localStorage.setItem('token', data.token);
      toast({
        title: "Login successful.",
        description: "You've been logged in!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "An error occurred.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
>>>>>>> origin/master
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <Box maxWidth="400px" margin="auto" mt={8}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <Heading>Log In</Heading>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full">Log In</Button>
        </VStack>
      </form>
    </Box>
>>>>>>> origin/master
  );
};

export default LoginForm;