<template>
  <div class="network-comparison-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  chartData: {
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
      labels: props.chartData.map(item => item.network),
      datasets: [
        {
          label: 'Clicks',
          data: props.chartData.map(item => item.clicks),
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        },
        {
          label: 'Conversions',
          data: props.chartData.map(item => item.conversions),
          backgroundColor: 'rgba(153, 102, 255, 0.6)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
};

onMounted(() => {
  createChart();
});

watch(() => props.chartData, () => {
  createChart();
}, { deep: true });
</script>

<style scoped>
.network-comparison-chart {
  height: 300px;
}
</style>
