<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { fmt } from '../core/utils.js'
import { CurvePlotter } from '../core/plotter.js'
import { buildChart } from '../core/iterationSeries.js'
import IterationChart from './IterationChart.vue'
import PagedTable from './PagedTable.vue'

const props = defineProps({ result: Object })
const canvas = ref(null)
const r = computed(() => props.result)
const isRoot = computed(() => r.value?.kind === 'root')
const isValue = computed(() => r.value?.kind === 'value')
const chart = computed(() => buildChart(r.value))
const fmtM = M => {
  const t = M.map(row => row.map(v => String(fmt(v, 4)))), w = Math.max(...t.flat().map(s => s.length))
  return t.map(row => row.map(s => s.padStart(w)).join('  ')).join('\n')
}

// กราฟเส้นโค้งของ Interpolation / Integration / Differentiation
watch(r, async v => {
  if (!v?.plot) return
  await nextTick()
  if (canvas.value) CurvePlotter.draw(canvas.value, v.plot)
})
</script>

<template>
  <div v-if="r" class="card">
    <template v-if="isRoot">
      <div class="res ok" v-if="r.all">พบรากที่ x ≈ {{ r.all.map(v => fmt(v)).join(', ') || 'ไม่พบในช่วงนี้' }}</div>
      <template v-else>
        <div class="res ok">root ≈ {{ fmt(r.root, 8) }}</div>
        <div class="note">f(root) = {{ fmt(r.fx) }} · {{ r.iters }} iterations</div>
      </template>
    </template>
    <template v-else-if="isValue">
      <div class="res ok">{{ r.label }} = {{ fmt(r.value, 8) }}</div>
      <div v-for="(n, i) in r.notes" :key="i" class="note">{{ n }}</div>
      <div v-if="r.warn" class="er">⚠ {{ r.warn }}</div>
    </template>
    <template v-else>
      <div class="res" :class="r.converged ? 'ok' : 'er'">x = [{{ r.x.map(v => fmt(v, 6)).join(', ') }}]</div>
      <div v-if="!r.direct" class="note">{{ r.converged ? 'ลู่เข้า' : 'ยังไม่ลู่เข้า' }} · {{ r.iters }} iterations</div>
      <div v-if="r.warn" class="er">⚠ {{ r.warn }}</div>
      <div v-for="(s, i) in r.steps" :key="i" class="step">
        <b>{{ i + 1 }}. {{ s.title }}</b>
        <pre v-if="s.M">{{ fmtM(s.M) }}</pre>
        <div v-if="s.note" class="note">{{ s.note }}</div>
      </div>
    </template>

    <template v-if="chart">
      <div class="note" style="margin-top: 10px">กราฟค่าในแต่ละ iteration — เลื่อน cursor ไปที่จุดเพื่อดูค่า</div>
      <IterationChart :chart="chart" />
    </template>
    <canvas v-if="r.plot" ref="canvas" />
    <PagedTable v-if="r.rows?.length" :rows="r.rows" :page-size="20" />
  </div>
</template>
