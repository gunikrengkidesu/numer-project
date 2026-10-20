<script setup>
import { ref, computed, watch } from 'vue'
import { fmt } from '../core/utils.js'

const props = defineProps({ rows: { type: Array, required: true }, pageSize: { type: Number, default: 20 } })
const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(props.rows.length / props.pageSize)))
const keys = computed(() => Object.keys(props.rows[0] ?? {}))
const slice = computed(() => props.rows.slice((page.value - 1) * props.pageSize, page.value * props.pageSize))
const from = computed(() => (page.value - 1) * props.pageSize + 1)
const to = computed(() => Math.min(page.value * props.pageSize, props.rows.length))
const jump = ref('')

watch(() => props.rows, () => (page.value = 1))
const go = n => { page.value = Math.min(pages.value, Math.max(1, parseInt(n) || 1)); jump.value = '' }

// เลขหน้าที่แสดง: หน้าแรก/สุดท้าย + รอบหน้าปัจจุบัน และ … คั่น
const nums = computed(() => {
  const s = new Set([1, pages.value])
  for (let i = page.value - 2; i <= page.value + 2; i++) if (i >= 1 && i <= pages.value) s.add(i)
  const a = [...s].sort((x, y) => x - y), out = []
  a.forEach((p, i) => { if (i && p - a[i - 1] > 1) out.push('…'); out.push(p) })
  return out
})
</script>

<template>
  <div class="pt">
    <div class="info">แสดงแถวที่ {{ from }}–{{ to }} จากทั้งหมด {{ rows.length }} แถว</div>
    <div class="wrapx">
      <table>
        <thead><tr><th v-for="k in keys" :key="k">{{ k }}</th></tr></thead>
        <tbody>
          <tr v-for="(row, i) in slice" :key="from + i">
            <td v-for="k in keys" :key="k">{{ k === 'i' ? row[k] : fmt(row[k]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="pages > 1" class="pager">
      <button class="sm" :disabled="page === 1" @click="go(page - 1)">‹</button>
      <template v-for="(n, i) in nums" :key="i">
        <span v-if="n === '…'" class="dots">…</span>
        <button v-else class="sm" :class="{ on: n === page }" @click="go(n)">{{ n }}</button>
      </template>
      <button class="sm" :disabled="page === pages" @click="go(page + 1)">›</button>
      <span class="goto">ไปหน้า
        <input v-model="jump" type="number" :min="1" :max="pages" :placeholder="`1–${pages}`" @keyup.enter="go(jump)" @change="go(jump)" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.info { color: var(--mu); font-size: .82rem; margin-bottom: 6px }
.wrapx { overflow-x: auto }
table th, table td { text-align: center }
.pager { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; justify-content: center; margin-top: 12px }
.pager button.on { background: var(--ac); color: #fff }
.pager button:disabled { opacity: .4; cursor: default }
.dots { color: var(--mu); padding: 0 2px }
.goto { margin-left: 10px; font-size: .85rem; color: var(--mu); display: inline-flex; align-items: center; gap: 6px }
.goto input { width: 84px; padding: 3px 6px; text-align: center }
</style>
