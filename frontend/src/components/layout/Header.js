import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Flex, Box, Link, Button, useColorMode, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { MoonIcon, SunIcon, ChevronDownIcon } from '@chakra-ui/icons';
import LoginForm from '../auth/LoginForm';
import SignupForm from '../auth/SignupForm';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'white');

  const handleLogin = (data) => {
    console.log('Login data:', data);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    localStorage.setItem('token', data.token);
  };

  const handleSignup = (data) => {
    console.log('Signup data:', data);
    setIsLoggedIn(true);
    setIsSignupModalOpen(false);
    localStorage.setItem('token', data.token);
  };

  return (
    <Box as="header" bg={bg} boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex maxW="container.xl" mx="auto" px={4} py={4} align="center" justify="space-between">
        <Link as={RouterLink} to="/" fontSize="xl" fontWeight="bold" color={color}>
          DealFinder
        </Link>
        <Flex align="center">
          {isLoggedIn ? (
            <>
              <Button as={RouterLink} to="/post-deal" mr={4}>Post a Deal</Button>
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                  Account
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                  <MenuItem as={RouterLink} to="/settings">Settings</MenuItem>
                  <MenuItem onClick={() => setIsLoggedIn(false)}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <>
              <Button onClick={() => setIsLoginModalOpen(true)} mr={2}>Login</Button>
              <Button onClick={() => setIsSignupModalOpen(true)} colorScheme="blue">Sign Up</Button>
            </>
          )}
          <Button onClick={toggleColorMode} ml={4}>
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Flex>
      </Flex>

      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <LoginForm onSubmit={handleLogin} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign Up</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SignupForm onSubmit={handleSignup} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Header;