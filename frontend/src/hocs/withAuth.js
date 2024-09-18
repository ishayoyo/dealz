// src/hocs/withAuth.js
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AuthModal from '../components/auth/AuthModal';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    const handleAuthRequired = () => {
      if (!isAuthenticated) {
        setIsAuthModalOpen(true);
        return false;
      }
      return true;
    };

    return (
      <>
        <WrappedComponent {...props} onAuthRequired={handleAuthRequired} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  };
};

export default withAuth;