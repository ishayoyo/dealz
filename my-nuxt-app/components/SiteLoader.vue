<template>
  <div class="fixed inset-0 bg-white z-[999] flex items-center justify-center">
    <div class="relative">
      <!-- Logo container with pulse effect -->
      <div class="animate-pulse">
        <img 
          src="/images/logo.png" 
          alt="Logo" 
          class="w-24 h-24 object-contain"
        />
      </div>
      <!-- Circular loading animation -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32">
        <div class="loading-circle"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #3B82F6; /* Tailwind blue-500 */
  animation: spin 1s linear infinite;
  position: relative;
}

.loading-circle::before,
.loading-circle::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  border: 3px solid transparent;
}

.loading-circle::before {
  top: 5px;
  left: 5px;
  right: 5px;
  bottom: 5px;
  border-top-color: #60A5FA; /* Tailwind blue-400 */
  animation: spin 2s linear infinite;
}

.loading-circle::after {
  top: 15px;
  left: 15px;
  right: 15px;
  bottom: 15px;
  border-top-color: #93C5FD; /* Tailwind blue-300 */
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 