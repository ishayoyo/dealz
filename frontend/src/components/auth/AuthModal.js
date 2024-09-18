import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { login as loginApi, signup as signupApi } from '../../utils/auth';
import { login, signup, setError } from '../../redux/slices/authSlice';

const AuthModal = ({ isOpen, onClose }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const toast = useToast();

  useEffect(() => {
    // Clear any existing errors when the modal is opened
    if (isOpen) {
      dispatch(setError(null));
    }
  }, [isOpen, dispatch]);

  const handleLogin = async (credentials) => {
    try {
      const userData = await loginApi(credentials);
      dispatch(login(userData));
      onClose();
      toast({
        title: "Login Successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const handleSignup = async (userData) => {
    try {
      const newUser = await signupApi(userData);
      dispatch(signup(newUser));
      onClose();
      toast({
        title: "Signup Successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Authentication</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}
          <Tabs index={tabIndex} onChange={setTabIndex}>
            <TabList>
              <Tab>Login</Tab>
              <Tab>Sign Up</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <LoginForm onSubmit={handleLogin} isLoading={loading} />
              </TabPanel>
              <TabPanel>
                <SignupForm onSubmit={handleSignup} isLoading={loading} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;