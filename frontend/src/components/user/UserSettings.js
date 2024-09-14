import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Switch,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';

const UserSettings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
  });

  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: checked
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the updated settings to your backend
    console.log('Updated settings:', settings);
  };

  return (
    <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md" maxWidth="400px" margin="auto" mt={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" textAlign="center" color={textColor}>User Settings</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="notifications" mb="0">
                Enable Notifications
              </FormLabel>
              <Switch
                id="notifications"
                name="notifications"
                isChecked={settings.notifications}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="darkMode" mb="0">
                Dark Mode
              </FormLabel>
              <Switch
                id="darkMode"
                name="darkMode"
                isChecked={settings.darkMode}
                onChange={handleChange}
              />
            </FormControl>
            <Button type="submit" colorScheme="blue" width="full">Update Settings</Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default UserSettings;