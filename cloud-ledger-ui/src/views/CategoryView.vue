<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'

const userStore = useUserStore()

/** 全部可用分类（预设 + 用户自定义） */
const allCategories = ref([])
const loading = ref(false)

/** 当前 Tab：'expense' 支出 / 'income' 收入 */
const activeType = ref('expense')

/** 图标候选列表（Element Plus 常用图标） */
const iconOptions = [
  'Grid', 'Food', 'Van', 'ShoppingBag', 'Medal', 'Reading',
  'House', 'Promotion', 'Lightning', 'Water', 'Phone', 'Brush',
  'GoldMedal', 'Cpu', 'Present', 'Document', 'Collection',
  'Tickets', 'Aim', 'Wallet', 'Clock', 'Star', 'Coin'
]

const dialogVisible = ref(false)
const dialogMode = ref('create')   // 'create' | 'edit'
const dialogLoading = ref(false)
const formRef = ref()
const form = ref({})

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '分类名称长度 1-20 字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择收支类型', trigger: 'change' }]
}

/** 按当前 Tab 过滤 */
const displayList = computed(() =>
  allCategories.value.filter(c => c.type === activeType.value)
)

async function load() {
  loading.value = true
  try {
    const res = await getCategories()
    allCategories.value = res.data.categories || []
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = 'create'
  form.value = {
    name: '',
    type: activeType.value,
    icon: 'Grid',
    color: '#409EFF',
    // 留空则由后端自动生成（同类型末尾 max+1）
    sort_order: null
  }
  dialogVisible.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon || 'Grid',
    color: row.color || '#409EFF',
    sort_order: row.sort_order ?? 0
  }
  dialogVisible.value = true
}

async function submit() {
  await formRef.value?.validate()
  dialogLoading.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      icon: form.value.icon,
      color: form.value.color
    }
    // 排序仅在下拉已填时提交；留空则后端自动生成（同类型 max+1）
    if (form.value.sort_order !== null && form.value.sort_order !== undefined) {
      payload.sort_order = Number(form.value.sort_order)
    }
    if (dialogMode.value === 'create') {
      payload.type = form.value.type
      await createCategory(payload)
      ElMessage.success('分类创建成功')
    } else {
      payload.sort_order = Number(form.value.sort_order ?? 0)
      await updateCategory(form.value.id, payload)
      ElMessage.success('分类更新成功')
    }
    dialogVisible.value = false
    await load()
  } catch (e) {
    // 拦截器已提示（409 重名 / 403 系统预设 等）
  } finally {
    dialogLoading.value = false
  }
}

async function handleDelete(row) {
  // 接口返回字段为 user_id（SNAKE_CASE），NULL 表示系统预设
  if (row.user_id == null) {
    ElMessage.warning('系统预设分类不可删除')
    return
  }
  await ElMessageBox.confirm(
    `确认删除自定义分类「${row.name}」？已引用的账单记录不会被修改，仅分类将变为灰色悬空状态。`,
    '删除分类',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  )
  try {
    await deleteCategory(row.id)
    ElMessage.success('分类已删除')
    await load()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 判断是否为用户自定义（接口字段为 user_id，NULL=系统预设） */
function isCustom(cat) {
  return cat.user_id != null
}

onMounted(load)
</script>

<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="header-row">
          <div class="title-with-switch">
            <span>分类管理</span>
            <el-radio-group v-model="activeType" size="default">
              <el-radio-button value="expense">支出分类</el-radio-button>
              <el-radio-button value="income">收入分类</el-radio-button>
            </el-radio-group>
          </div>
          <div>
            <el-button @click="load">刷新</el-button>
            <el-button type="primary" @click="openCreate">+ 新建自定义分类</el-button>
          </div>
        </div>
      </template>

      <el-table :data="displayList" stripe v-loading="loading">
        <el-table-column label="预览" width="120">
          <template #default="{ row }">
            <div class="cat-preview">
              <el-icon :size="20" :color="row.color">
                <component :is="row.icon" />
              </el-icon>
              <span class="cat-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column label="图标" width="110">
          <template #default="{ row }">
            <el-icon :size="18"><component :is="row.icon" /></el-icon>
            <span class="muted">{{ row.icon }}</span>
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="100">
          <template #default="{ row }">
            <span class="color-chip" :style="{ background: row.color }" />
            <span class="muted">{{ row.color }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="70" />
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag v-if="isCustom(row)" type="success" effect="plain" size="small">自定义</el-tag>
            <el-tag v-else type="info" effect="plain" size="small">系统预设</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" :disabled="!isCustom(row)" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :disabled="!isCustom(row)" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑 dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建自定义分类' : '编辑分类'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit placeholder="如：午餐、工资、兼职" />
        </el-form-item>
        <el-form-item label="收支类型" prop="type">
          <el-radio-group v-model="form.type" :disabled="dialogMode === 'edit'">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="form.icon" style="width: 100%" placeholder="选择图标">
            <el-option
              v-for="icon in iconOptions"
              :key="icon"
              :value="icon"
              :label="icon"
            >
              <span class="icon-option">
                <el-icon><component :is="icon" /></el-icon>
                <span>{{ icon }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="form.color" show-alpha />
        </el-form-item>
        <el-form-item label="排序序号">
          <el-input-number
            v-model="form.sort_order"
            :min="0"
            :max="9999"
            :placeholder="dialogMode === 'create' ? '留空自动排到末尾' : ''"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="submit">
          {{ dialogMode === 'create' ? '创建' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.title-with-switch {
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 600;
}
.cat-preview {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cat-name {
  font-size: 13px;
  color: #303133;
}
.color-chip {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  margin-right: 6px;
  vertical-align: middle;
}
.muted {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}
.icon-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
