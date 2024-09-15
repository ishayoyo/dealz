import React, { useState } from 'react';
<<<<<<< HEAD
import { VStack, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { registerUser } from '../../utils/api';
=======
import { useNavigate } from 'react-router-dom';
import { Box, VStack, FormControl, FormLabel, Input, Button, Heading, useToast } from '@chakra-ui/react';
import { signup } from '../../utils/auth';
>>>>>>> origin/master

const SignupForm = () => {
  const [formData, setFormData] = useState({
    username: '',
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
      const data = await registerUser(formData);
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
=======
    try {
      const data = await signup(formData);
      localStorage.setItem('token', data.token);
      toast({
        title: "Account created.",
        description: "You've successfully signed up!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error.message,
>>>>>>> origin/master
        status: "error",
        duration: 5000,
        isClosable: true,
      });
<<<<<<< HEAD
    } finally {
      setIsLoading(false);
=======
>>>>>>> origin/master
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <Box maxWidth="400px" margin="auto" mt={8}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <Heading>Sign Up</Heading>
          <FormControl isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </FormControl>
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
          <Button type="submit" colorScheme="blue" width="full">Sign Up</Button>
        </VStack>
      </form>
    </Box>
>>>>>>> origin/master
  );
};

export default SignupForm;