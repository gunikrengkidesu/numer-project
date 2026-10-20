<script setup>
import { computed } from 'vue'
const m = defineModel({ required: true }) // { k: จำนวนตัวแปร x, rows: [[x1..xk, y], ...] }
const props = defineProps({ multi: Boolean })
const head = computed(() => (props.multi ? [...Array.from({ length: m.value.k }, (_, i) => `x${i + 1}`), 'y'] : ['x', 'y']))
const setK = v => {
  const k = Math.max(1, Math.min(5, parseInt(v) || 1))
  m.value = { k, rows: m.value.rows.map(r => Array.from({ length: k + 1 }, (_, j) => (j === k ? r[r.length - 1] : r[j]) ?? '')) }
}
const addRow = () => m.value.rows.push(Array(m.value.k + 1).fill(''))
const delRow = i => m.value.rows.length > 2 && m.value.rows.splice(i, 1)
</script>

<template>
  <template v-if="multi">
    <label>จำนวนตัวแปร x (1–5)</label>
    <input type="number" min="1" max="5" style="width: 90px" :value="m.k" @change="setK($event.target.value)" />
  </template>
  <label>ข้อมูล ({{ m.rows.length }} จุด)</label>
  <div class="pts" :style="{ gridTemplateColumns: `repeat(${m.k + 1}, 76px) 32px` }">
    <div v-for="h in head" :key="h" class="cap">{{ h }}</div><div />
    <template v-for="(row, i) in m.rows" :key="i">
      <input v-for="(_, j) in row" :key="j" v-model="m.rows[i][j]" inputmode="decimal" style="text-align: center" />
      <button class="sm" title="ลบแถว" @click="delRow(i)">✕</button>
    </template>
  </div>
  <button class="sm" style="margin-top: 8px" @click="addRow">+ เพิ่มจุด</button>
</template>

<style scoped>
.pts { display: grid; gap: 4px; align-items: center }
</style>
