<script setup lang="ts">
import { computed } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'vue-chartjs';
import chartjsPluginTrendline from 'chartjs-plugin-trendline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  chartjsPluginTrendline
);

const props = defineProps<{
  labels: string[];
  datasets: any[];
}>();

const chartData = computed(() => {
  return {
    labels: props.labels,
    datasets: props.datasets.map(ds => ({
      ...ds,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 3
    }))
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#374151'
      },
      ticks: {
        color: '#9ca3af'
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#9ca3af'
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: '#d1d5db'
      }
    }
  }
};
</script>

<template>
  <div class="h-64 w-full">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
