// theme.js
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#e0f2fe',
      100: '#bae6fd',
      200: '#7dd3fc',
      300: '#38bdf8',
      400: '#0ea5e9',
      500: '#0284c7',
      600: '#0369a1',
      700: '#075985',
      800: '#0c4a6e',
      900: '#082f49',
    },
  },
  fonts: {
    heading: 'Montserrat, sans-serif', // Changed to Montserrat for a sleeker look
    body: 'Roboto, sans-serif', // Changed to Roboto for better readability
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50', // Adjusted background colors
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900', // Adjusted text colors
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'md',
      },
    },
    Card: {
      baseStyle: {
        p: '6',
        rounded: 'xl', // Increased border radius for a modern look
        boxShadow: 'xl', // Increased shadow for depth
        border: '1px solid', // Added a subtle border
        borderColor: 'gray.200', // Light border color
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'semibold', // Slightly reduced font weight for a sleeker look
        letterSpacing: '-0.02em', // Tightened letter spacing
      },
    },
    Text: {
      baseStyle: {
        lineHeight: 'tall', // Increased line height for better readability
      },
    },
  },
});

export default theme;