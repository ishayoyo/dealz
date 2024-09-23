import { ref, onMounted, onUnmounted } from 'vue'
import { useNuxtApp } from '#app'

export const useSocket = () => {
  const nuxtApp = useNuxtApp()
  const socket = ref(null)
  const isConnected = ref(false)
  const lastMessage = ref(null)
  const connectionError = ref(null)

  const initSocket = () => {
    console.log('Initializing socket...')
    socket.value = nuxtApp.$socket
    if (socket.value) {
      console.log('Socket instance found:', socket.value.id)

      socket.value.on('connect', () => {
        console.log('Socket connected:', socket.value.id)
        isConnected.value = true
        connectionError.value = null
      })

      socket.value.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
        isConnected.value = false
        connectionError.value = error.message
      })

      socket.value.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        isConnected.value = false
      })

      socket.value.on('testResponse', (data) => {
        console.log('Received test response:', data)
        lastMessage.value = data.message
      })
    } else {
      console.error('Socket instance not found')
      connectionError.value = 'Socket instance not found'
    }
  }

  const testConnection = () => {
    if (socket.value && socket.value.connected) {
      console.log('Emitting test event...')
      socket.value.emit('testConnection', { test: 'data' })
    } else {
      console.error('Socket not connected', socket.value)
      connectionError.value = 'Socket not connected'
    }
  }

  onMounted(() => {
    initSocket()
  })

  onUnmounted(() => {
    if (socket.value) {
      console.log('Cleaning up socket listeners')
      socket.value.off('connect')
      socket.value.off('connect_error')
      socket.value.off('disconnect')
      socket.value.off('testResponse')
    }
  })

  return {
    isConnected,
    lastMessage,
    connectionError,
    testConnection
  }
}