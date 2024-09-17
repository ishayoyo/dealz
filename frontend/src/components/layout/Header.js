import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { Flex, Box, Link, Button, useColorMode, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { MoonIcon, SunIcon, ChevronDownIcon } from '@chakra-ui/icons';
import LoginForm from '../auth/LoginForm';
import SignupForm from '../auth/SignupForm';
import PostDealForm from '../deals/PostDealForm';
import { checkAuthStatus, logoutUser } from '../../utils/auth';

const Header = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'white');

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLogin = () => {
    setIsLoginModalOpen(false);
  };

  const handleSignup = () => {
    setIsSignupModalOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <Box as="header" bg={bg} boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex maxW="container.xl" mx="auto" px={4} py={4} align="center" justify="space-between">
        <Link as={RouterLink} to="/" fontSize="xl" fontWeight="bold" color={color}>
          DealFinder
        </Link>
        <Flex align="center">
          {isAuthenticated ? (
            <>
              <PostDealForm />
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} ml={4}>
                  Account
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                  <MenuItem as={RouterLink} to="/settings">Settings</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
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