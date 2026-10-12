<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useUserStore } from '@/stores/user'
import { monthlyStats, trend } from '@/api/report'
import { formatMoney, currentMonth } from '@/utils/format'

const userStore = useUserStore()

const month = ref(currentMonth())
const stats = ref(null)
const trends = ref([])
const loading = ref(false)

const pieRef = ref(null)
const trendRef = ref(null)
let pieChart = null
let trendChart = null

function renderPie() {
  if (!pieRef.value) return
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const categoryStats = stats.value?.categoryStats || {}
  const data = Object.entries(categoryStats).map(([name, value]) => ({ name, value: Number(value) }))
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        name: '分类支出',
        type: 'pie',
        radius: ['40%', '65%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data
      }
    ]
  })
}

function renderTrend() {
  if (!trendRef.value) return
  if (!trendChart) trendChart = echarts.init(trendRef.value)
  const months = trends.value.map((t) => t.month)
  const income = trends.value.map((t) => Number(t.income))
  const expense = trends.value.map((t) => Number(t.expense))
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    series: [
      { name: '收入', type: 'bar', data: income, itemStyle: { color: '#67c23a' } },
      { name: '支出', type: 'bar', data: expense, itemStyle: { color: '#f56c6c' } }
    ]
  })
}

async function load() {
  loading.value = true
  try {
    const [statsRes, trendRes] = await Promise.all([
      monthlyStats(userStore.userId, month.value),
      trend(userStore.userId, 6)
    ])
    stats.value = statsRes.data.stats
    trends.value = trendRes.data.trends || []
    await nextTick()
    renderPie()
    renderTrend()
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function handleResize() {
  pieChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  load()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  trendChart?.dispose()
})
</script>

<template>
  <div v-loading="loading">
    <el-card class="page-card">
      <template #header>
        <div class="header-row">
          <span>统计分析</span>
          <el-date-picker
            v-model="month"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            style="width: 160px"
            @change="load"
          />
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-label">收入</div>
            <div class="stat-value text-income">¥{{ formatMoney(stats?.income) }}</div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-label">支出</div>
            <div class="stat-value text-expense">¥{{ formatMoney(stats?.expense) }}</div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-label">结余</div>
            <div class="stat-value">¥{{ formatMoney(stats?.balance) }}</div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-label">预算执行率</div>
            <div class="stat-value">{{ stats?.budget != null ? stats?.budgetUsed + '%' : '—' }}</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <el-card class="page-card">
          <template #header>
            <span>{{ month }} 分类支出占比</span>
          </template>
          <div ref="pieRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card class="page-card">
          <template #header>
            <span>近 6 个月收支趋势</span>
          </template>
          <div ref="trendRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-card {
  text-align: center;
  margin-bottom: 16px;
}
.stat-label {
  color: #909399;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
}
.chart {
  height: 320px;
}
</style>
