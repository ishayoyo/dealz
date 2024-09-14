import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e0f2fe',
      100: '#bae6fd',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
    },
  },
  fonts: {
    heading: 'Poppins, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
});

export default theme;