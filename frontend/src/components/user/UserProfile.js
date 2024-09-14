import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
} from '@chakra-ui/react';

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
  });

  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the updated profile data to your backend
    console.log('Updated profile:', profileData);
    setIsEditing(false);
  };

  return (
    <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md" maxWidth="400px" margin="auto" mt={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" textAlign="center" color={textColor}>User Profile</Heading>
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  placeholder="Name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" width="full">Save Changes</Button>
            </VStack>
          </form>
        ) : (
          <VStack spacing={4} align="stretch">
            <Text><strong>Name:</strong> {profileData.name}</Text>
            <Text><strong>Email:</strong> {profileData.email}</Text>
            <Button onClick={() => setIsEditing(true)} colorScheme="blue">Edit Profile</Button>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default UserProfile;