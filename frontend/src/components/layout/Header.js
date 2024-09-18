// src/components/layout/Header.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  IconButton,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, ChevronDownIcon, BellIcon } from '@chakra-ui/icons';
import { logout } from '../../redux/slices/authSlice';
import AuthModal from '../auth/AuthModal';
import PostDealForm from '../deals/PostDealForm';
import { checkAuthStatus } from '../../utils/auth';

const Header = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { colorMode, toggleColorMode } = useColorMode();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Box as="header" bg={useColorModeValue('white', 'gray.800')} boxShadow="md">
      <Flex maxW="container.xl" mx="auto" px={4} py={3} align="center" justify="space-between">
        <Link as={RouterLink} to="/" fontSize="2xl" fontWeight="bold">
          DealFinder
        </Link>
        <Flex align="center">
          {isAuthenticated ? (
            <>
              <PostDealForm />
              <IconButton
                icon={<BellIcon />}
                aria-label="Notifications"
                variant="ghost"
                mr={4}
              />
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                  {user?.username || 'Account'}
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                  <MenuItem as={RouterLink} to="/settings">Settings</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)}>Login / Sign Up</Button>
          )}
          <IconButton
            onClick={toggleColorMode}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            variant="ghost"
            ml={4}
            aria-label="Toggle color mode"
          />
        </Flex>
      </Flex>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </Box>
  );
};

export default Header;