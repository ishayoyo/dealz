<template>
  <button 
    v-if="!isDealModalOpen && isAuthenticated"
    @click="$emit('click')" 
    class="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 flex items-center justify-center z-[40] group animate-bounce-slow button-gradient"
  >
    <div class="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 animate-spin-slow opacity-75"></div>
    <div class="relative bg-white rounded-full p-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 group-hover:rotate-90 transition-transform duration-300 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </div>
  </button>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

defineProps({
  isDealModalOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped>
@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 3s infinite ease-in-out;
}

.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

.button-gradient {
  background: linear-gradient(145deg, var(--primary-600), var(--secondary-600));
}

button {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
}

/* Increase visibility with a glowing effect */
button::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, var(--primary-400), var(--secondary-400));
  z-index: -1;
  border-radius: 50%;
  filter: blur(15px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

button:hover::after {
  opacity: 0.7;
}

@media (min-width: 768px) {
  button {
    display: none;
  }
}
</style>
