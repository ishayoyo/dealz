import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './redux/store'; // adjust path if needed
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, CSSReset, Box } from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CategoryButtons from './components/layout/CategoryButtons';
import HomePage from './pages/HomePage';
import DealPage from './pages/DealPage';
import UserProfile from './components/user/UserProfile';
import UserSettings from './components/user/UserSettings';
import theme from './theme';
import { checkAuthStatus } from './redux/slices/authSlice'; // adjust path if needed

function AppContent() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Router>
        <Box minHeight="100vh" display="flex" flexDirection="column">
          <Header />
          <Box flex={1} px={4}>
            <CategoryButtons />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/deal/:id" element={<DealPage />} />
                <Route path="/profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/" />} />
                <Route path="/settings" element={isAuthenticated ? <UserSettings /> : <Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </Box>
          <Footer />
        </Box>
      </Router>
    </ChakraProvider>
  );
}

function App() {
  return (
    <PersistGate loading={null} persistor={persistor}>
      <AppContent />
    </PersistGate>
  );
}

export default App;