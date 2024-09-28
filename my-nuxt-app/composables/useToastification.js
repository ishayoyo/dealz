import { useToast } from 'vue-toastification'

export const useToastification = () => {
  if (process.client) {
    return useToast()
  }
  // Return a dummy function for server-side rendering
  return {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {}
  }
}