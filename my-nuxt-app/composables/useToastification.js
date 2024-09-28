import Toast from 'vue-toastification'

export const useToastification = () => {
  if (process.client) {
    const { useToast } = Toast
    return useToast()
  }
  // Return a dummy function for server-side rendering
  return () => {}
}
