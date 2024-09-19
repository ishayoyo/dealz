// src/App.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DealPage from './pages/DealPage';
import ProfilePage from './pages/ProfilePage';
import { checkAuthStatus } from './utils/auth';
import { fetchUserDeals } from './redux/slices/userSlice';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorPage from './pages/ErrorPage';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const initializeApp = async () => {
      await dispatch(checkAuthStatus());
      if (isAuthenticated && user) {
        dispatch(fetchUserDeals());
      }
    };

    initializeApp();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchUserDeals());
    }
  }, [dispatch, isAuthenticated, user]);

  return (
    <ChakraProvider>
      <ErrorBoundary>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/deal/:id" element={<DealPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/error" element={<ErrorPage />} />
          </Routes>
          <Footer />
        </Router>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default App;