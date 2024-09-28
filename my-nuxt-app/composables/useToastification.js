import Toast from 'vue-toastification'

export const useToastification = () => {
  const { useToast } = Toast
  return useToast()
}
