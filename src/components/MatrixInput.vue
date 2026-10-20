<script setup>
import { resizeMatrix } from '../core/matrix.js'
const m = defineModel({ required: true })
defineProps({ showX0: { type: Boolean, default: true } })
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
          <input v-for="(_, j) in row" :key="j" v-model="m.A[i][j]" class="cell" inputmode="decimal" />
        </template>
      </div>
    </div>
    <div v-if="showX0">
      <div class="cap">x₀ (เริ่มต้น)</div>
      <div class="vcol"><input v-for="(_, i) in m.x0" :key="i" v-model="m.x0[i]" class="cell" inputmode="decimal" /></div>
    </div>
    <div>
      <div class="cap">b</div>
      <div class="vcol"><input v-for="(_, i) in m.b" :key="i" v-model="m.b[i]" class="cell" inputmode="decimal" /></div>
    </div>
  </div>
  <div class="note">{{ showX0 ? "x₀ เว้นว่าง = 0 · " : "" }}ช่องว่างในเมทริกซ์ถือเป็น 0</div>
</template>
