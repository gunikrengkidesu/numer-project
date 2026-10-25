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
  const t = M.map(row => row.map(v => String(fmt(v)))), w = Math.max(...t.flat().map(s => s.length))
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
      <div v-if="r.warn" class="er">⚠ {{ r.warn }}</div>
    </template>
    <template v-else-if="isValue">
      <div class="res ok">{{ r.label }} = {{ fmt(r.value, 8) }}</div>
      <template v-if="!r.answerOnly">
        <div v-for="(n, i) in r.notes" :key="i" class="note">{{ n }}</div>
        <div v-if="r.warn" class="er">⚠ {{ r.warn }}</div>
        <div v-if="r.solution" class="solution">
          <h3 class="sol-title">{{ r.solution.title }}</h3>
          <div v-for="b in r.solution.basis" :key="b.name" class="sol-row">
            <span class="sol-name">{{ b.name }}</span>
            <span>=</span>
            <span class="frac"><span class="num">{{ b.symbolic.num }}</span><span class="den">{{ b.symbolic.den }}</span></span>
            <span>=</span>
            <span class="frac"><span class="num">{{ b.numeric.num }}</span><span class="den">{{ b.numeric.den }}</span></span>
            <span>=</span>
            <span class="sol-val">{{ b.value }}</span>
          </div>
          <div v-if="r.solution.interval" class="note">{{ r.solution.interval }}</div>
          <div class="sol-expr">
            <span>{{ r.solution.expr.label }} =</span>
            <span>{{ r.solution.expr.body }}</span>
          </div>
          <div class="sol-answer">{{ r.solution.expr.label }} = {{ r.solution.expr.value }}</div>
        </div>
      </template>
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

    <template v-if="chart && !r.answerOnly">
      <div class="note" style="margin-top: 10px">กราฟแสดงจุดสำคัญ (เริ่มต้น · ระหว่างทาง · ผลลัพธ์) — เลื่อน cursor ไปที่จุดเพื่อดูค่า ตารางด้านล่างแสดงครบทุก iteration</div>
      <IterationChart :chart="chart" />
    </template>
    <canvas v-if="r.plot && !r.answerOnly" ref="canvas" />
    <PagedTable v-if="r.rows?.length && !r.answerOnly && !r.hideTable" :rows="r.rows" :page-size="20" />
  </div>
</template>
