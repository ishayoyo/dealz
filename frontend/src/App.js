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
import { isAuthenticated } from './utils/auth';

function App() {
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    setAuth(isAuthenticated());
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Router>
        <Box minHeight="100vh" display="flex" flexDirection="column">
          <Header isAuthenticated={auth} setAuth={setAuth} />
          <Box flex={1} px={4}>
            <CategoryButtons />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/deal/:id" element={<DealPage />} />
                <Route path="/profile" element={auth ? <UserProfile /> : <Navigate to="/login" />} />
                <Route path="/settings" element={auth ? <UserSettings /> : <Navigate to="/login" />} />
                <Route path="/login" element={<LoginForm setAuth={setAuth} />} />
                <Route path="/signup" element={<SignupForm setAuth={setAuth} />} />
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