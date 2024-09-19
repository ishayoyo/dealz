import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error);
    console.error("Error info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={5}>
          <Heading>Something went wrong.</Heading>
          <Text>Please try refreshing the page or contact support if the problem persists.</Text>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;