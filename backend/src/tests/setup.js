// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_COOKIE_EXPIRES_IN = '1';

// Set timeout for tests
jest.setTimeout(30000);

// Mock socket.io
jest.mock('socket.io', () => {
  return function() {
    return {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
  };
});

// Mock NotificationService
jest.mock('../services/NotificationService', () => {
  return jest.fn().mockImplementation(() => ({
    createFollowNotification: jest.fn().mockResolvedValue({}),
    getUnreadNotifications: jest.fn().mockResolvedValue([]),
    markAsRead: jest.fn().mockResolvedValue({})
  }));
});

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
  jest.clearAllMocks();
});
