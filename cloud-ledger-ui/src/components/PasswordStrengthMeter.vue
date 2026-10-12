<script setup>
import { computed } from 'vue'

// 评分规则与后端 PasswordPolicy.strengthScore 保持一致
const BASELINE_RE = /^(?=.*[A-Za-z])(?=.*\d).+$/

const props = defineProps({
  password: { type: String, default: '' }
})

const score = computed(() => {
  const pwd = props.password || ''
  if (!pwd || pwd.length < 8 || pwd.length > 64 || !BASELINE_RE.test(pwd)) return 0
  let s = 1
  if (pwd.length >= 12) s++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return Math.min(s, 4)
})

// 1=弱 2=中 3=强 4=很强；0=未达基线
const LEVELS = [
  null,
  { label: '弱', color: '#F56C6C', percent: 25 },
  { label: '中', color: '#E6A23C', percent: 50 },
  { label: '强', color: '#409EFF', percent: 75 },
  { label: '很强', color: '#67C23A', percent: 100 }
]

const level = computed(() => LEVELS[score.value])
</script>

<template>
  <div v-if="password" class="pwd-meter">
    <el-progress
      :percentage="level ? level.percent : 0"
      :stroke-width="6"
      :show-text="false"
      :color="level ? level.color : '#F56C6C'"
    />
    <span class="pwd-meter__label" :style="{ color: level ? level.color : '#F56C6C' }">
      {{ score === 0 ? '未达最低要求：至少 8 位且包含字母和数字' : '密码强度：' + level.label }}
    </span>
  </div>
</template>

<style scoped>
.pwd-meter {
  margin-top: 2px;
}
.pwd-meter__label {
  display: inline-block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
}
</style>
