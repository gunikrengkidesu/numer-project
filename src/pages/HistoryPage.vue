<script setup>
import { ref, computed } from 'vue'
import { REGISTRY } from '../core/registry.js'
import { records, pending, repository } from '../db'

const emit = defineEmits(['load'])
const filter = ref('ทั้งหมด')
const items = computed(() => records.value.filter(i => filter.value === 'ทั้งหมด' || i.cat === filter.value))

function detail(it) {
  const p = JSON.parse(it.input)
  if (p.A) { const b = p.b.trim().split(/\s+/); return `A ${b.length}×${b.length}, b = [${b.join(', ')}]` }
  if (p.pts) return `${p.pts.trim().split(/\n+/).length} จุด, x = ${p.xq}`
  const range = p.a !== undefined && p.b !== undefined ? ` ช่วง [${p.a}, ${p.b}]` : p.h !== undefined ? ` ที่ x = ${p.x}, h = ${p.h}` : ''
  return 'f(x) = ' + p.fx + (p.gx ? ', g(x) = ' + p.gx : '') + range
}
const load = it => { pending.value = it; emit('load') }
const clearAll = () => records.value.length && confirm('ล้างประวัติทั้งหมด?') && repository.clear()
</script>

<template>
  <div class="card">
    <div class="filters">
      <div class="tabs" style="margin: 0">
        <button v-for="f in ['ทั้งหมด', ...Object.keys(REGISTRY)]" :key="f" class="tab" :class="{ on: f === filter }" @click="filter = f">{{ f }}</button>
      </div>
      <button class="sm" @click="clearAll">ล้างประวัติทั้งหมด</button>
    </div>
    <div v-if="!items.length" class="note">ยังไม่มีประวัติการคำนวณ</div>
    <div v-else class="scroll" style="max-height: none">
      <table>
        <thead><tr><th class="l">เวลา</th><th class="l">หมวด</th><th class="l">วิธี</th><th class="l">Input</th><th class="l">ผลลัพธ์</th><th></th></tr></thead>
        <tbody>
          <tr v-for="it in items" :key="it.id">
            <td class="l">{{ new Date(it.ts).toLocaleString('th-TH') }}</td>
            <td class="l">{{ it.cat }}</td>
            <td class="l">{{ it.method }}</td>
            <td class="l">{{ detail(it) }}</td>
            <td class="l">{{ it.summary }}</td>
            <td>
              <button class="sm" @click="load(it)">โหลด</button>
              <button class="sm" style="margin-left: 6px" @click="repository.remove(it.id)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
