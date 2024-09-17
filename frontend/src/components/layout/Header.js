import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAuthenticated, setUser, logout } from '../../redux/slices/authSlice';
import { Link as RouterLink } from 'react-router-dom';
import {
  Flex,
  Box,
  Link,
  Button,
  useColorMode,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  VStack
} from '@chakra-ui/react';
import {
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
  SearchIcon,
  BellIcon,
  HamburgerIcon,
  CloseIcon
} from '@chakra-ui/icons';
import LoginForm from '../auth/LoginForm';
import SignupForm from '../auth/SignupForm';
import PostDealForm from '../deals/PostDealForm';

const Header = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'white');

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = (userData) => {
    dispatch(setAuthenticated(true));
    dispatch(setUser(userData));
    setIsLoginModalOpen(false);
  };

  const handleSignup = (userData) => {
    dispatch(setAuthenticated(true));
    dispatch(setUser(userData));
    setIsSignupModalOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Box as="header" bg={bg} boxShadow="md" position="sticky" top={0} zIndex={10}>
      <Flex maxW="container.xl" mx="auto" px={4} py={3} align="center" justify="space-between">
        <Flex align="center">
          <Link as={RouterLink} to="/" fontSize={["xl", "2xl"]} fontWeight="bold" color={color} mr={[2, 8]}>
            DealFinder
          </Link>
          <InputGroup maxW="400px" display={["none", "none", "flex"]}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input placeholder="Search deals..." borderRadius="full" />
          </InputGroup>
        </Flex>
        <Flex align="center">
          <IconButton
            icon={<SearchIcon />}
            aria-label="Search"
            variant="ghost"
            display={["flex", "flex", "none"]}
            mr={2}
          />
          {isAuthenticated ? (
            <>
              <PostDealForm />
              <IconButton
                icon={<BellIcon />}
                aria-label="Notifications"
                variant="ghost"
                fontSize="20px"
                mr={4}
                display={["none", "flex"]}
              />
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} display={["none", "flex"]}>
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
              <Button onClick={() => setIsLoginModalOpen(true)} variant="ghost" mr={2} display={["none", "flex"]}>Login</Button>
              <Button onClick={() => setIsSignupModalOpen(true)} colorScheme="blue" display={["none", "flex"]}>Sign Up</Button>
            </>
          )}
          <IconButton
            onClick={toggleColorMode}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            variant="ghost"
            ml={4}
            aria-label="Toggle color mode"
          />
          <IconButton
            icon={<HamburgerIcon />}
            aria-label="Open menu"
            variant="ghost"
            ml={2}
            display={["flex", "none"]}
            onClick={() => setIsMenuOpen(true)}
          />
        </Flex>
      </Flex>

      {/* Mobile menu */}
      <Box
        display={[isMenuOpen ? "block" : "none", "none"]}
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg={bg}
        zIndex={20}
        p={4}
      >
        <Flex direction="column" align="center">
          <IconButton
            icon={<CloseIcon />}
            aria-label="Close menu"
            alignSelf="flex-end"
            onClick={() => setIsMenuOpen(false)}
            mb={8}
          />
          <InputGroup maxW="400px" mb={8}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input placeholder="Search deals..." borderRadius="full" />
          </InputGroup>
          {isAuthenticated ? (
            <VStack spacing={4} align="stretch" width="100%">
              <Button as={RouterLink} to="/profile" w="full">Profile</Button>
              <Button as={RouterLink} to="/settings" w="full">Settings</Button>
              <Button onClick={handleLogout} w="full">Logout</Button>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch" width="100%">
              <Button onClick={() => setIsLoginModalOpen(true)} w="full">Login</Button>
              <Button onClick={() => setIsSignupModalOpen(true)} colorScheme="blue" w="full">Sign Up</Button>
            </VStack>
          )}
        </Flex>
      </Box>

      {/* Login Modal */}
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

      {/* Signup Modal */}
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