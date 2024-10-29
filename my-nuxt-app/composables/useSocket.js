import { ref } from 'vue'
import { io } from 'socket.io-client'
import { useRuntimeConfig } from '#app'

const socket = ref(null)
const isConnected = ref(false)

export const useSocket = () => {
  const config = useRuntimeConfig()
  
  if (process.client && !socket.value) {
    const socketUrl = config.public.socketUrl
    socket.value = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socket.value.on('connect', () => {
      console.log('Socket connected:', socket.value.id)
      isConnected.value = true
    })

    socket.value.on('disconnect', () => {
      console.log('Socket disconnected')
      isConnected.value = false
    })
  }

  return socket.value
}

export const useSocketStatus = () => {
  return {
    isConnected,
    socket
  }
}