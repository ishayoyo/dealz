import { Box, Text } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Box as="footer" py={4} textAlign="center">
      <Text fontSize="sm" color="gray.500">
        © 2024 DealFinder. All rights reserved.
      </Text>
    </Box>
  );
}