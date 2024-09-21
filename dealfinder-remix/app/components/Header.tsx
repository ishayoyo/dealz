// app/components/Header.tsx
import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { Box, Flex, Link, Button, useColorMode, Menu, MenuButton, MenuList, MenuItem, IconButton } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";
import { BellIcon, ChevronDownIcon } from '@chakra-ui/icons';
import AuthModal from './auth/AuthModal';
import PostDealForm from './PostDealForm';

interface HeaderProps {
  user: any; // Replace 'any' with your actual user type
}

export default function Header({ user }: HeaderProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Implement logout logic here
    navigate('/logout');
  };

  return (
    <Box as="header" bg={colorMode === 'light' ? 'white' : 'gray.800'} boxShadow="md">
      <Flex maxW="container.xl" mx="auto" px={4} py={3} align="center" justify="space-between">
        <Link as={RemixLink} to="/" fontSize="2xl" fontWeight="bold">
          DealFinder
        </Link>
        <Flex align="center">
          {user ? (
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
                  {user.username}
                </MenuButton>
                <MenuList>
                  <MenuItem as={RemixLink} to="/profile">Profile</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)}>Login / Sign Up</Button>
          )}
          <Button onClick={toggleColorMode} ml={4}>
            {colorMode === 'light' ? 'Dark' : 'Light'} Mode
          </Button>
        </Flex>
      </Flex>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </Box>
  );
}