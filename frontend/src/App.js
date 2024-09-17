import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, CSSReset, Box } from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CategoryButtons from './components/layout/CategoryButtons';
import HomePage from './pages/HomePage';
import DealPage from './pages/DealPage';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import UserProfile from './components/user/UserProfile';
import UserSettings from './components/user/UserSettings';
import theme from './theme';
import { isAuthenticated as checkIsAuthenticated } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(checkIsAuthenticated());
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Router>
        <Box minHeight="100vh" display="flex" flexDirection="column">
          <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          <Box flex={1} px={4}>
            <CategoryButtons />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} />} />
                <Route path="/deal/:id" element={<DealPage isAuthenticated={isAuthenticated} />} />
                <Route path="/profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
                <Route path="/settings" element={isAuthenticated ? <UserSettings /> : <Navigate to="/login" />} />
                <Route path="/login" element={<LoginForm setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/signup" element={<SignupForm setIsAuthenticated={setIsAuthenticated} />} />
              </Routes>
            </AnimatePresence>
          </Box>
          <Footer />
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;