<script setup>
import { computed } from 'vue'
import { resizeMatrix, EXAMPLE } from '../core/matrix.js'
import { isBlank } from '../core/validate.js'
const m = defineModel({ required: true })
defineProps({ showX0: { type: Boolean, default: true }, invalid: Boolean }) // invalid = กดคำนวณแล้วข้อมูลไม่ครบ
const anyX0 = computed(() => m.value.x0.some(v => !isBlank(v)))
const resize = n => (m.value = resizeMatrix(m.value, n))
</script>

<template>
  <label>ขนาดเมทริกซ์ n × n (2–8)</label>
  <input type="number" min="2" max="8" style="width: 90px" :value="m.n" @change="resize($event.target.value)" />
  <div class="mwrap">
    <div>
      <div class="cap">A</div>
      <div class="mgrid" :style="{ gridTemplateColumns: `repeat(${m.n}, var(--cs))` }">
        <template v-for="(row, i) in m.A" :key="i">
          <input v-for="(_, j) in row" :key="j" v-model="m.A[i][j]" class="cell" :class="{ bad: invalid && isBlank(m.A[i][j]) }" :placeholder="String(EXAMPLE.A[i]?.[j] ?? 0)" inputmode="decimal" />
        </template>
      </div>
    </div>
    <div v-if="showX0">
      <div class="cap">x₀ (เริ่มต้น)</div>
      <div class="vcol"><input v-for="(_, i) in m.x0" :key="i" v-model="m.x0[i]" class="cell" :class="{ bad: invalid && anyX0 && isBlank(m.x0[i]) }" placeholder="0" inputmode="decimal" /></div>
    </div>
    <div>
      <div class="cap">b</div>
      <div class="vcol"><input v-for="(_, i) in m.b" :key="i" v-model="m.b[i]" class="cell" :class="{ bad: invalid && isBlank(m.b[i]) }" :placeholder="String(EXAMPLE.b[i] ?? 0)" inputmode="decimal" /></div>
    </div>
  </div>
  <div class="note">{{ showX0 ? "x₀ เว้นว่างทั้งหมดได้ (ถือเป็น 0) · " : "" }}ช่องอื่นต้องกรอกให้ครบ</div>
</template>
