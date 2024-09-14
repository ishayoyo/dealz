import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Flex, Box, Link, Button, useColorMode, useColorModeValue, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { MoonIcon, SunIcon, ChevronDownIcon } from '@chakra-ui/icons';
import PostDealForm from '../deals/PostDealForm';

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'white');

  return (
    <Box as="header" bg={bg} boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex maxW="container.xl" mx="auto" px={4} py={4} align="center" justify="space-between">
        <Link as={RouterLink} to="/" fontSize="xl" fontWeight="bold" color={color}>
          DealFinder
        </Link>
        <Flex align="center">
          <PostDealForm />
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} ml={4}>
              Account
            </MenuButton>
            <MenuList>
              <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
              <MenuItem as={RouterLink} to="/settings">Settings</MenuItem>
            </MenuList>
          </Menu>
          <Button onClick={toggleColorMode} ml={4}>
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;