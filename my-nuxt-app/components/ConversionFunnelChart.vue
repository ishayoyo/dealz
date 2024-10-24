<template>
  <div class="conversion-funnel-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  funnelData: {
    type: Array,
    required: true
  }
});

const chartCanvas = ref(null);
let chart = null;

const createChart = () => {
  if (chart) {
    chart.destroy();
  }

  const ctx = chartCanvas.value.getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.funnelData.map(item => item.stage),
      datasets: [
        {
          label: 'Users',
          data: props.funnelData.map(item => item.users),
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
};

onMounted(() => {
  createChart();
});

watch(() => props.funnelData, () => {
  createChart();
}, { deep: true });
</script>

<style scoped>
.conversion-funnel-chart {
  height: 300px;
}
</style>
