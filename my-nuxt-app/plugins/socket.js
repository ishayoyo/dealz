// plugins/sockets.js
import io from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const socket = io(config.public.socketUrl || 'http://localhost:5000') // Your server URL

  return {
    provide: {
      socket: socket
    }
  }
})