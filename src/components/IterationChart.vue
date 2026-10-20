<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ chart: { type: Object, required: true } })

const W = 900, H = 380, M = { l: 60, r: 22, t: 16, b: 48 }
const PALETTE = ['#2f5fe3', '#e8590c', '#2b8a3e', '#ae3ec9', '#d6336c', '#0c8599', '#f08c00', '#495057']
const svg = ref(null)
const hover = ref(null)
const multi = computed(() => props.chart.series.length > 1)

const allPts = computed(() => props.chart.series.flatMap(s => s.points))
const domain = (vals, include0, padRatio) => {
  let lo = Math.min(...vals, ...(include0 ? [0] : [])), hi = Math.max(...vals, ...(include0 ? [0] : []))
  if (lo === hi) { lo -= 1; hi += 1 }
  const p = (hi - lo) * padRatio
  return [lo - p, hi + p]
}
const xd = computed(() => domain(allPts.value.map(p => p.x), false, 0.06))
// เส้นโค้ง f(x) จริง (เส้นเรียบ) ในช่วง x ที่ iteration ผ่านมา
const curvePts = computed(() => {
  const c = props.chart.curve
  if (!c) return []
  const [a, b] = xd.value, N = 240
  return Array.from({ length: N + 1 }, (_, i) => { const x = a + (b - a) * i / N; return [x, c.f(x)] }).filter(q => isFinite(q[1]))
})
const yd = computed(() => domain([...allPts.value.map(p => p.y), ...curvePts.value.map(q => q[1])], props.chart.zero, 0.08))
const X = x => M.l + (x - xd.value[0]) / (xd.value[1] - xd.value[0]) * (W - M.l - M.r)
const Y = y => H - M.b - (y - yd.value[0]) / (yd.value[1] - yd.value[0]) * (H - M.t - M.b)

function ticks([lo, hi], count = 6) {
  const step0 = (hi - lo) / count, mag = 10 ** Math.floor(Math.log10(step0)), n = step0 / mag
  const step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag, out = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-12; v += step) out.push(+v.toFixed(10))
  return out
}
const xt = computed(() => ticks(xd.value, 8)), yt = computed(() => ticks(yd.value, 6))
const tick = v => (Math.abs(v) >= 1e5 || (v !== 0 && Math.abs(v) < 1e-3) ? v.toExponential(1) : +v.toPrecision(6))
const path = s => s.points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ')
const curvePath = computed(() => curvePts.value.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' '))
const legend = computed(() => props.chart.curve
  ? [{ name: 'f(x)', c: 'var(--ac)' }, { name: 'ลำดับ iteration', c: 'var(--ok)' }, { name: 'จุดแต่ละ iteration', c: 'var(--er)' }]
  : multi.value ? props.chart.series.map((s, i) => ({ name: s.name, c: PALETTE[i % PALETTE.length] })) : [])
const color = i => (multi.value ? PALETTE[i % PALETTE.length] : 'var(--ok)')
const dot = i => (multi.value ? PALETTE[i % PALETTE.length] : 'var(--er)')
const dense = computed(() => allPts.value.length > 150)

function onMove(ev) { // หาจุดที่ใกล้ cursor ที่สุด
  const r = svg.value.getBoundingClientRect()
  const mx = (ev.clientX - r.left) / r.width * W, my = (ev.clientY - r.top) / r.height * H
  let best = null, bd = 28 * 28
  props.chart.series.forEach((s, si) => s.points.forEach(p => {
    const d = (X(p.x) - mx) ** 2 + (Y(p.y) - my) ** 2
    if (d < bd) { bd = d; best = { p, si, cx: X(p.x), cy: Y(p.y), name: s.name } }
  }))
  hover.value = best
}
const tipStyle = computed(() => hover.value && {
  left: hover.value.cx / W * 100 + '%', top: hover.value.cy / H * 100 + '%',
  transform: hover.value.cy < 120 ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 12px))'
})
</script>

<template>
  <div class="chart">
    <div v-if="legend.length" class="legend"><span v-for="l in legend" :key="l.name"><i :style="{ background: l.c }" />{{ l.name }}</span></div>
    <svg ref="svg" :viewBox="`0 0 ${W} ${H}`" @pointermove="onMove" @pointerleave="hover = null">
      <g>
        <line v-for="t in xt" :key="'vx' + t" :x1="X(t)" :x2="X(t)" :y1="M.t" :y2="H - M.b" class="grid" />
        <line v-for="t in yt" :key="'hy' + t" :x1="M.l" :x2="W - M.r" :y1="Y(t)" :y2="Y(t)" class="grid" />
        <line v-if="chart.zero && yd[0] < 0 && yd[1] > 0" :x1="M.l" :x2="W - M.r" :y1="Y(0)" :y2="Y(0)" class="zero" />
        <text v-for="t in xt" :key="'tx' + t" :x="X(t)" :y="H - M.b + 20" class="tick" text-anchor="middle">{{ tick(t) }}</text>
        <text v-for="t in yt" :key="'ty' + t" :x="M.l - 8" :y="Y(t) + 4" class="tick" text-anchor="end">{{ tick(t) }}</text>
        <text :x="(M.l + W - M.r) / 2" :y="H - 6" class="axis" text-anchor="middle">{{ chart.xLabel }}</text>
        <text :x="14" :y="(M.t + H - M.b) / 2" class="axis" text-anchor="middle" :transform="`rotate(-90 14 ${(M.t + H - M.b) / 2})`">{{ chart.yLabel }}</text>
      </g>
      <path v-if="curvePath" :d="curvePath" fill="none" style="stroke: var(--ac)" stroke-width="2.2" />
      <g v-for="(s, i) in chart.series" :key="s.name">
        <path :d="path(s)" fill="none" :style="{ stroke: color(i) }" stroke-width="1.6" :stroke-dasharray="chart.curve ? '6 4' : null" />
        <circle v-for="(p, j) in s.points" :key="j" :cx="X(p.x)" :cy="Y(p.y)" :r="dense ? 1.8 : 3.6" :style="{ fill: dot(i) }" />
      </g>
      <g v-if="hover">
        <line :x1="hover.cx" :x2="hover.cx" :y1="M.t" :y2="H - M.b" class="cross" />
        <line :x1="M.l" :x2="W - M.r" :y1="hover.cy" :y2="hover.cy" class="cross" />
        <circle :cx="hover.cx" :cy="hover.cy" r="7" class="ring" />
      </g>
    </svg>
    <div v-if="hover" class="tip" :style="tipStyle">
      <div v-for="(l, i) in hover.p.lines" :key="i" :class="{ first: !i }">{{ l }}</div>
    </div>
  </div>
</template>

<style scoped>
.chart { position: relative; margin: 8px 0 14px }
svg { width: 100%; height: auto; display: block; touch-action: none }
.grid { stroke: var(--bd); stroke-width: 1 }
.zero { stroke: var(--mu); stroke-width: 1.4 }
.tick { fill: var(--mu); font-size: 12px; font-family: "JetBrains Mono", monospace }
.axis { fill: var(--mu); font-size: 13px }
.cross { stroke: var(--mu); stroke-dasharray: 4 4; stroke-width: 1 }
.ring { fill: none; stroke: var(--ac); stroke-width: 2.5 }
.tip { position: absolute; pointer-events: none; z-index: 5; background: var(--card); color: var(--tx); border: 1px solid var(--bd); border-radius: 8px; padding: 6px 10px; font: .8rem "JetBrains Mono", monospace; white-space: nowrap; box-shadow: 0 4px 14px rgba(0, 0, 0, .18) }
.tip .first { font-weight: 600; color: var(--ac); margin-bottom: 2px }
.legend { display: flex; gap: 12px; flex-wrap: wrap; font-size: .82rem; color: var(--mu); margin-bottom: 4px }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px }
</style>
