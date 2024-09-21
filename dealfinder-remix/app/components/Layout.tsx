// app/components/Layout.tsx
import { Box } from "@chakra-ui/react";
import Header from "./Header";

interface LayoutProps {
  user: any; // Replace 'any' with your actual user type
  children: React.ReactNode;
}

export default function Layout({ user, children }: LayoutProps) {
  return (
    <Box>
      <Header user={user} />
      <Box as="main" maxW="container.xl" mx="auto" px={4} py={8}>
        {children}
      </Box>
    </Box>
  );
}