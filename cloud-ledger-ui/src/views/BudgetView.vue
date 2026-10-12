<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { setBudget, getBudget, updateBudget } from '@/api/budget'
import { formatMoney, currentMonth } from '@/utils/format'

const userStore = useUserStore()

const month = ref(currentMonth())
const amount = ref(null)
const budget = ref(null)
const loading = ref(false)

async function query() {
  loading.value = true
  try {
    const res = await getBudget(userStore.userId, month.value)
    budget.value = res.data.budget
    amount.value = Number(res.data.budget.amount)
  } catch (e) {
    // 该月暂无预算：清空后进入“新建”模式（拦截器已提示）
    budget.value = null
    amount.value = null
  } finally {
    loading.value = false
  }
}

async function save() {
  if (amount.value == null || amount.value <= 0) {
    ElMessage.warning('请输入大于 0 的预算金额')
    return
  }
  try {
    if (budget.value) {
      await updateBudget(budget.value.budget_id, { amount: amount.value })
      ElMessage.success('预算已更新')
    } else {
      await setBudget({
        user_id: userStore.userId,
        month: month.value,
        amount: amount.value
      })
      ElMessage.success('预算已设置')
    }
    query()
  } catch (e) {
    // 拦截器已提示
  }
}
</script>

<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <span>预算管理</span>
      </template>

      <div class="page-toolbar">
        <el-date-picker
          v-model="month"
          type="month"
          placeholder="选择月份"
          value-format="YYYY-MM"
          style="width: 180px"
        />
        <el-button @click="query">查询预算</el-button>
      </div>

      <el-descriptions v-if="budget" :column="1" border class="budget-info">
        <el-descriptions-item label="预算月份">{{ budget.month }}</el-descriptions-item>
        <el-descriptions-item label="当前预算金额">
          <span class="text-expense">¥{{ formatMoney(budget.amount) }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else-if="!loading" description="该月暂无预算，可在下方设置" :image-size="80" />

      <el-form label-width="100px" class="budget-form">
        <el-form-item label="预算金额">
          <el-input-number
            v-model="amount"
            :min="0.01"
            :precision="2"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="save">
            {{ budget ? '更新预算' : '设置预算' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.budget-info {
  margin-bottom: 16px;
}
.budget-form {
  margin-top: 16px;
  max-width: 420px;
}
</style>
