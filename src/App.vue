<script setup>
import { ref } from 'vue'
import CalculatorPage from './pages/CalculatorPage.vue'
import HistoryPage from './pages/HistoryPage.vue'
import { records } from './db'

const page = ref('calc')
</script>

<template>
  <div class="wrap">
    <h1>Numerical Methods Calculator</h1>
    <div class="tabs nav">
      <button class="tab" :class="{ on: page === 'calc' }" @click="page = 'calc'">คำนวณ</button>
      <button class="tab" :class="{ on: page === 'hist' }" @click="page = 'hist'">
        ประวัติ <span class="badge">{{ records.length }}</span>
      </button>
    </div>
    <CalculatorPage v-show="page === 'calc'" />
    <HistoryPage v-show="page === 'hist'" @load="page = 'calc'" />
  </div>
</template>
