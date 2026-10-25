<script setup>
import { ref, reactive, computed, shallowRef, watch } from 'vue'
import { REGISTRY } from '../core/registry.js'
import { defaultMatrix, serializeMatrix, parseMatrix } from '../core/matrix.js'
import { defaultPoints, serializePoints, pointsFromString } from '../core/points.js'
import { fmt } from '../core/utils.js'
import { INCOMPLETE, isBlank, matrixComplete, pointsComplete } from '../core/validate.js'
import { repository, pending } from '../db/index.js'
import MatrixInput from '../components/MatrixInput.vue'
import PointsInput from '../components/PointsInput.vue'
import ResultView from '../components/ResultView.vue'

const cat = ref('Root of Equation')
const method = ref('Graphical')
const vals = reactive({})
const matrix = ref(defaultMatrix())
const points = ref(defaultPoints(false))
const result = shallowRef(null)
const error = ref('')
const tried = ref(false) // กดคำนวณแล้วหรือยัง (ใช้ไฮไลต์ช่องที่ยังว่าง)
const valuesByCategory = {}
const pointsByCategory = {}
const clonePoints = p => ({ k: p.k, rows: p.rows.map(row => [...row]) })

const K = computed(() => REGISTRY[cat.value].items[method.value])
const type = computed(() => K.value.input ?? REGISTRY[cat.value].mode) // root | matrix | points | multi | fx
const usesPoints = computed(() => type.value === 'points' || type.value === 'multi')
const direct = computed(() => type.value === 'matrix' && K.value.direct)
const fields = computed(() => {
  const C = REGISTRY[cat.value]
  if (type.value === 'root') return [C.common[0], ...K.value.fields, ...(K.value.useTolerance === false ? [] : C.common.slice(1))] // Graphical ไม่มี tolerance
  if (type.value === 'onepoint') return K.value.fields
  if (type.value === 'matrix') return direct.value ? [] : K.value.errorOnly ? K.value.fields : [['tol', 'Tolerance', '0.000001'], ['max', 'Max iterations', '100']]
  return K.value.fields
})
const wide = k => ['fx', 'gx', 'xq'].includes(k) || type.value === 'matrix'

function select(c, m, saved = null) {
  if (Object.keys(vals).length) {
    const current = valuesByCategory[cat.value] ?? {}
    fields.value.forEach(([k]) => { current[k] = vals[k] })
    valuesByCategory[cat.value] = current
  }
  if (usesPoints.value) pointsByCategory[cat.value] = clonePoints(points.value)
  cat.value = c
  method.value = m ?? Object.keys(REGISTRY[c].items)[0]
  const stored = saved ?? valuesByCategory[c] ?? {}
  Object.keys(vals).forEach(k => delete vals[k])
  fields.value.forEach(([k]) => (vals[k] = stored[k] ?? '')) // ว่าง = ใช้ข้อความตัวอย่าง (placeholder)
  if (saved) valuesByCategory[c] = { ...(valuesByCategory[c] ?? {}), ...saved }
  if (type.value === 'matrix' && saved?.A) matrix.value = parseMatrix(saved)
  if (usesPoints.value) {
    points.value = saved?.pts ? pointsFromString(saved.pts) : pointsByCategory[c] ? clonePoints(pointsByCategory[c]) : defaultPoints(type.value === 'multi')
    pointsByCategory[c] = clonePoints(points.value)
  }
  result.value = null; error.value = ''; tried.value = false
}
select(cat.value, method.value)

function summarize(res) {
  if (res.kind === 'root') return res.all ? 'roots ≈ ' + (res.all.map(v => fmt(v, 4)).join(', ') || '-') : 'root ≈ ' + fmt(res.root)
  if (res.kind === 'value') return `${res.label} = ${fmt(res.value)}`
  return 'x = [' + res.x.map(v => fmt(v, 4)).join(', ') + ']'
}

function complete() {
  return fields.value.every(([k]) => !isBlank(vals[k]))
    && (type.value !== 'matrix' || matrixComplete(matrix.value, !direct.value))
    && (!usesPoints.value || pointsComplete(points.value))
}

function run() {
  tried.value = true
  if (!complete()) { result.value = null; error.value = INCOMPLETE; return }
  try {
    const p = {}
    fields.value.forEach(([k]) => (p[k] = String(vals[k]).trim()))
    if (type.value === 'matrix') Object.assign(p, serializeMatrix(matrix.value))
    if (usesPoints.value) p.pts = serializePoints(points.value)
    const res = new K.value(p).solve()
    result.value = res; error.value = ''
    repository.add({ ts: Date.now(), cat: cat.value, method: method.value, input: JSON.stringify(p), summary: summarize(res) })
  } catch (e) { result.value = null; error.value = e.message }
}

// โหลดจากหน้าประวัติ
watch(pending, it => { if (it) { select(it.cat, it.method, JSON.parse(it.input)); pending.value = null } })
</script>

<template>
  <div>
  <div class="card">
    <div class="tabs">
      <button v-for="c in Object.keys(REGISTRY)" :key="c" class="tab" :class="{ on: c === cat }" @click="select(c)">{{ c }}</button>
    </div>
    <div class="tabs">
      <button v-for="m in Object.keys(REGISTRY[cat].items)" :key="m" class="tab" :class="{ on: m === method }" @click="select(cat, m)">{{ m }}</button>
    </div>
    <MatrixInput v-if="type === 'matrix'" v-model="matrix" :show-x0="!direct" :invalid="tried" />
    <PointsInput v-if="usesPoints" v-model="points" :multi="type === 'multi'" :invalid="tried" />
    <div :class="type === 'matrix' ? '' : 'row'">
      <div v-for="[k, label, def] in fields" :key="cat + method + k" :style="wide(k) ? 'grid-column: 1 / -1' : ''">
        <label>{{ label }}</label>
        <input v-model="vals[k]" :placeholder="def" :class="{ bad: tried && isBlank(vals[k]) }" />
      </div>
    </div>
    <button class="go" @click="run">คำนวณ</button>
  </div>
  <div v-if="error" class="card er">⚠ {{ error }}</div>
  <ResultView :result="result" />
  </div>
</template>
