<script setup>
import { ref, reactive, computed, shallowRef, watch } from 'vue'
import { REGISTRY } from '../core/registry.js'
import { defaultMatrix, serializeMatrix, parseMatrix } from '../core/matrix.js'
import { defaultPoints, serializePoints, pointsFromString } from '../core/points.js'
import { fmt } from '../core/utils.js'
import { repository, pending } from '../db'
import MatrixInput from '../components/MatrixInput.vue'
import PointsInput from '../components/PointsInput.vue'
import ResultView from '../components/ResultView.vue'

const cat = ref('Root of Equation')
const method = ref('Bisection')
const vals = reactive({})
const matrix = ref(defaultMatrix())
const points = ref(defaultPoints(false))
const result = shallowRef(null)
const error = ref('')

const K = computed(() => REGISTRY[cat.value].items[method.value])
const type = computed(() => K.value.input ?? REGISTRY[cat.value].mode) // root | matrix | points | multi | fx
const usesPoints = computed(() => type.value === 'points' || type.value === 'multi')
const direct = computed(() => type.value === 'matrix' && K.value.direct)
const fields = computed(() => {
  const C = REGISTRY[cat.value]
  if (type.value === 'root') return [C.common[0], ...K.value.fields, C.common[1], C.common[2]]
  if (type.value === 'matrix') return direct.value ? [] : [['tol', 'Tolerance', '0.000001'], ['max', 'Max iterations', '100']]
  return K.value.fields
})
const wide = k => ['fx', 'gx', 'xq'].includes(k) || type.value === 'matrix'

function select(c, m, saved = null) {
  cat.value = c
  method.value = m ?? Object.keys(REGISTRY[c].items)[0]
  Object.keys(vals).forEach(k => delete vals[k])
  fields.value.forEach(([k, , def]) => (vals[k] = saved?.[k] ?? def))
  if (type.value === 'matrix' && saved?.A) matrix.value = parseMatrix(saved)
  if (usesPoints.value) points.value = saved?.pts ? pointsFromString(saved.pts) : defaultPoints(type.value === 'multi')
  result.value = null; error.value = ''
}
select(cat.value, method.value)

function summarize(res) {
  if (res.kind === 'root') return res.all ? 'roots ≈ ' + (res.all.map(v => fmt(v, 4)).join(', ') || '-') : 'root ≈ ' + fmt(res.root)
  if (res.kind === 'value') return `${res.label} = ${fmt(res.value)}`
  return 'x = [' + res.x.map(v => fmt(v, 4)).join(', ') + ']'
}

function run() {
  try {
    const p = { ...vals }
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
  <div class="card">
    <div class="tabs">
      <button v-for="c in Object.keys(REGISTRY)" :key="c" class="tab" :class="{ on: c === cat }" @click="select(c)">{{ c }}</button>
    </div>
    <div class="tabs">
      <button v-for="m in Object.keys(REGISTRY[cat].items)" :key="m" class="tab" :class="{ on: m === method }" @click="select(cat, m)">{{ m }}</button>
    </div>
    <MatrixInput v-if="type === 'matrix'" v-model="matrix" :show-x0="!direct" />
    <PointsInput v-if="usesPoints" v-model="points" :multi="type === 'multi'" />
    <div :class="type === 'matrix' ? '' : 'row'">
      <div v-for="[k, label] in fields" :key="cat + method + k" :style="wide(k) ? 'grid-column: 1 / -1' : ''">
        <label>{{ label }}</label>
        <input v-model="vals[k]" />
      </div>
    </div>
    <button class="go" @click="run">คำนวณ</button>
  </div>
  <div v-if="error" class="card er">⚠ {{ error }}</div>
  <ResultView :result="result" />
</template>
