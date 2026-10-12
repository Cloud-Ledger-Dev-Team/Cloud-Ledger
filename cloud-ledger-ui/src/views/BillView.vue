<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { listBills, createBill, updateBill, deleteBill } from '@/api/bill'
import { listAccounts } from '@/api/account'
import { getCategories } from '@/api/category'
import { formatMoney, today } from '@/utils/format'

const userStore = useUserStore()

const bills = ref([])
const accounts = ref([])
const categories = ref({ income: [], expense: [] })
const loading = ref(false)

const filter = ref({ type: '', startDate: '', endDate: '' })

const dialogVisible = ref(false)
const dialogMode = ref('create')
const form = ref({})

const typeOptions = [
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' }
]

async function loadMeta() {
  const [accRes, catRes] = await Promise.all([
    listAccounts(userStore.userId),
    getCategories()
  ])
  accounts.value = accRes.data.accounts || []
  // data.groups 是后端按 type 分组的纯 name 字符串列表，保持旧用法兼容
  categories.value = catRes.data.groups
}

async function load() {
  loading.value = true
  try {
    const params = { user_id: userStore.userId }
    if (filter.value.type) params.type = filter.value.type
    if (filter.value.startDate) params.startDate = filter.value.startDate
    if (filter.value.endDate) params.endDate = filter.value.endDate
    const res = await listBills(params)
    bills.value = res.data.bills || []
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function categoryOptions() {
  const type = form.value.type || 'expense'
  return categories.value[type] || []
}

function openCreate() {
  dialogMode.value = 'create'
  form.value = {
    type: 'expense',
    category: '',
    amount: 0,
    date: today(),
    description: '',
    account_id: accounts.value[0]?.account_id || ''
  }
  dialogVisible.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  form.value = {
    bill_id: row.bill_id,
    type: row.type,
    category: row.category,
    amount: Number(row.amount),
    date: row.date,
    description: row.description || '',
    account_id: ''
  }
  dialogVisible.value = true
}

async function submit() {
  try {
    if (dialogMode.value === 'create') {
      await createBill({
        user_id: userStore.userId,
        account_id: form.value.account_id,
        type: form.value.type,
        category: form.value.category,
        amount: form.value.amount,
        date: form.value.date,
        description: form.value.description
      })
      ElMessage.success('账单创建成功')
    } else {
      await updateBill(form.value.bill_id, {
        amount: form.value.amount,
        category: form.value.category,
        date: form.value.date,
        description: form.value.description
      })
      ElMessage.success('账单更新成功')
    }
    dialogVisible.value = false
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm('删除账单将恢复对应账户余额，确认删除？', '提示', { type: 'warning' })
  try {
    await deleteBill(row.bill_id)
    ElMessage.success('账单已删除')
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

function resetFilter() {
  filter.value = { type: '', startDate: '', endDate: '' }
  load()
}

onMounted(async () => {
  await loadMeta()
  load()
})
</script>

<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="header-row">
          <span>账单管理</span>
          <el-button type="primary" @click="openCreate">记一笔</el-button>
        </div>
      </template>

      <div class="page-toolbar">
        <el-select v-model="filter.type" placeholder="收支类型" clearable style="width: 140px" @change="load">
          <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-date-picker v-model="filter.startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" @change="load" />
        <el-date-picker v-model="filter.endDate" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" @change="load" />
        <el-button @click="resetFilter">重置</el-button>
      </div>

      <el-table :data="bills" stripe v-loading="loading">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'text-income' : 'text-expense'">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'text-income' : 'text-expense'">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ formatMoney(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '记一笔' : '编辑账单'"
      width="460px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item v-if="dialogMode === 'create'" label="账户">
          <el-select v-model="form.account_id" style="width: 100%">
            <el-option v-for="a in accounts" :key="a.account_id" :label="a.name" :value="a.account_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type" :disabled="dialogMode === 'edit'">
            <el-radio-button v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%" placeholder="选择分类">
            <el-option v-for="c in categoryOptions()" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
