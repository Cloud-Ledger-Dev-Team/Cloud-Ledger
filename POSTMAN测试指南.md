# Cloud Ledger 项目 Postman 测试指南


## 一、用户模块测试

### 1. 用户注册 (POST)
**目的**：创建新用户账户

**请求信息**：
- 方法：`POST`
- URL：`http://localhost:5000/api/register`
- 请求头：`Content-Type: application/json`
- 请求体 (JSON)：
  ```json
  {
    "name": "演示用户",
    "email": "demo@example.com",
    "password": "123456"
  }
  ```
预期{
    "success": true,
    "user": {
        "email": "demo@example.com",
        "name": "演示用户",
        "user_id": "884b7401-e568-4686-a840-bb06aab8588f"
    }
}


### 2. 用户登录 (POST)
**目的**：验证用户身份并获取用户信息

**请求信息**：
- 方法：`POST`
- URL：`http://localhost:5000/api/login`
- 请求头：`Content-Type: application/json`
- 请求体 (JSON)：
  ```json
  {
    "email": "demo@example.com",
    "password": "123456"
  }
  ```

**预期响应**：
{
    "success": true,
    "user": {
        "email": "demo@example.com",
        "name": "演示用户",
        "user_id": "884b7401-e568-4686-a840-bb06aab8588f"
    }
}



## 二、账户模块测试

### 3. 获取账户列表 (GET)
**目的**：查询用户的所有账户

**请求信息**：
- 方法：`GET`
- URL：http://localhost:5000/api/accounts?user_id=884b7401-e568-4686-a840-bb06aab8588f
- 请求头：无特殊要求

**预期响应**：
{
    "accounts": [
        {
            "account_id": "74d0efc8-611b-400c-9cf9-248082ff9ba3",
            "balance": 0.0,
            "name": "默认账户",
            "type": "现金"
        }
    ],
    "success": true
}



### 4. 添加新账户 (POST)
**目的**：创建新的账户/资产

**请求信息**：
- 方法：`POST`
- URL：`http://localhost:5000/api/accounts`
- 请求头：`Content-Type: application/json`
- 请求体 (JSON)：
  {
    "user_id": "884b7401-e568-4686-a840-bb06aab8588f",
    "name": "建设银行储蓄卡",
    "type": "银行卡",
    "balance": 5000.00
  }
  ```

**预期响应**：
{
    "account": {
        "account_id": "0a2b4a86-c69b-46b4-9277-5b7444ff63f6",
        "balance": 5000.0,
        "name": "建设银行储蓄卡",
        "type": "银行卡"
    },
    "success": true
}

### 5. 更新账户信息 (PUT)
**目的**：修改现有账户的信息

**请求信息**：
- 方法：`PUT`
- URL：`http://localhost:5000/api/accounts/0a2b4a86-c69b-46b4-9277-5b7444ff63f6`
- 请求头：`Content-Type: application/json`
- 请求体 (JSON)：
  {
    "name": "招商银行储蓄卡（更新）",
    "balance": 3000.00
  }

**预期响应**：
{
    "account": {
        "account_id": "0a2b4a86-c69b-46b4-9277-5b7444ff63f6",
        "balance": 3000.0,
        "name": "招商银行储蓄卡（更新）",
        "type": "银行卡"
    },
    "success": true
}

### 6. 删除账户 (DELETE)
**目的**：移除用户的账户（注意：有相关账单的账户无法删除）

**请求信息**：
- 方法：`DELETE`
- URL：`http://localhost:5000/api/accounts/0a2b4a86-c69b-46b4-9277-5b7444ff63f6`
- 请求头：无特殊要求

**预期响应**：
{
    "success": true
}

## 三、账单模块测试


### 7. 添加新账单 (POST)
**目的**：记录一笔收支交易

**请求信息**：
- 方法：`POST`
- URL：`http://localhost:5000/api/bills`
- 请求头：`Content-Type: application/json`
- 请求体 (JSON)：
  {
    "user_id": "884b7401-e568-4686-a840-bb06aab8588f",
    "account_id": "0a2b4a86-c69b-46b4-9277-5b7444ff63f6",
    "type": "expense", 
    "category": "餐饮",
    "amount": 88.50,
    "date": "2024-01-15",
    "description": "午餐消费"
  }

**预期响应**：
{
    "bill": {
        "account_id": "0a2b4a86-c69b-46b4-9277-5b7444ff63f6",
        "amount": 88.5,
        "bill_id": "58605b31-994b-49d0-8ef3-4f589bb8cb01",
        "category": "餐饮",
        "date": "2024-01-15",
        "description": "午餐消费",
        "type": "expense"
    },
    "success": true
}

### 8. 获取账单列表 (GET)
**目的**：查询用户的账单记录，支持筛选

**请求信息**：
- 方法：`GET`
- URL：`http://localhost:5000/api/bills?user_id=YOUR_USER_ID`
- 可选筛选参数：
  - `type=expense` 
  - `category=餐饮`
  - `startDate=2024-01-01`
  - `endDate=2024-01-31`
- 示例：`http://localhost:5000/api/bills?user_id=YOUR_USER_ID&type=expense&category=餐饮`

**预期响应**：
{
    "bills": [
        {
            "account_id": "0a2b4a86-c69b-46b4-9277-5b7444ff63f6",
            "amount": 88.5,
            "bill_id": "58605b31-994b-49d0-8ef3-4f589bb8cb01",
            "category": "餐饮",
            "date": "2024-01-15",
            "description": "午餐消费",
            "type": "expense"
        }
    ],
    "success": true
}


### 9. 更新账单信息 (PUT)
**目的**：修改现有账单的详细信息

**请求信息**：
- 方法：`PUT`
- URL：`http://localhost:5000/api/bills/BILL_ID`
- 请求头：`Content-Type: application/json`
- 请求体 (JSON)：
  ```json
  {
    "amount": 128.50,
    "description": "晚餐聚餐（更新后）",
    "category": "餐饮"
  }
  ```

**预期响应**：
- 状态码：`200 OK`
- 响应体：
  ```json
  {
    "success": true,
    "bill": {
      "bill_id": "BILL_ID",
      "account_id": "ACCOUNT_ID",
      "type": "expense",
      "category": "餐饮",
      "amount": 128.50,
      "date": "2024-01-15",
      "description": "晚餐聚餐（更新后）"
    }
  }
  ```

### 10. 删除账单 (DELETE)
**目的**：移除一笔账单记录

**请求信息**：
- 方法：`DELETE`
- URL：`http://localhost:5000/api/bills/BILL_ID`
- 请求头：无特殊要求

**预期响应**：
- 状态码：`200 OK`
- 响应体：
  ```json
  {
    "success": true
  }
  ```

## 四、预算模块测试

### 11. 设置月度预算 (POST)
**目的**：为特定月份设置预算限额

**请求信息**：
- 方法：`POST`
- URL：`http://localhost:5000/api/budgets`
- 请求头：`Content-Type: application/json`
- 请求体 (JSON)：
  ```json
  {
    "user_id": "YOUR_USER_ID",
    "month": "2024-01",
    "amount": 5000.00
  }
  ```

**预期响应**：
- 状态码：`200 OK`
- 响应体：
  ```json
  {
    "success": true,
    "budget": {
      "budget_id": "budget-uuid",
      "user_id": "YOUR_USER_ID",
      "month": "2024-01",
      "amount": 5000.00
    }
  }
  ```

### 12. 获取月度预算 (GET)
**目的**：查询特定月份的预算设置

**请求信息**：
- 方法：`GET`
- URL：`http://localhost:5000/api/budgets/YOUR_USER_ID/2024-01`
- 请求头：无特殊要求

**预期响应**：
- 状态码：`200 OK`
- 响应体：
  ```json
  {
    "success": true,
    "budget": {
      "budget_id": "budget-uuid",
      "user_id": "YOUR_USER_ID",
      "month": "2024-01",
      "amount": 5000.00
    }
  }
  ```

### 13. 更新预算 (PUT)
**目的**：修改现有预算的金额

**请求信息**：
- 方法：`PUT`
- URL：`http://localhost:5000/api/budgets/BUDGET_ID`
- 请求头：`Content-Type: application/json`
- 请求体 (JSON)：
  ```json
  {
    "amount": 6000.00
  }
  ```

**预期响应**：
- 状态码：`200 OK`
- 响应体：
  ```json
  {
    "success": true,
    "budget": {
      "budget_id": "BUDGET_ID",
      "user_id": "YOUR_USER_ID",
      "month": "2024-01",
      "amount": 6000.00
    }
  }
  ```

## 五、分类模块测试

### 14. 获取分类列表 (GET)
**目的**：获取系统支持的收支分类

**请求信息**：
- 方法：`GET`
- URL：`http://localhost:5000/api/categories`
- 请求头：无特殊要求

**预期响应**：
- 状态码：`200 OK`
- 响应体：分类列表

## 六、数据分析模块测试

### 15. 获取月度分析 (GET)
**目的**：获取特定月份的收支分析数据

**请求信息**：
- 方法：`GET`
- URL：`http://localhost:5000/api/analytics/monthly/YOUR_USER_ID/2024-01`
- 请求头：无特殊要求

**预期响应**：
- 状态码：`200 OK`
- 响应体：月度收支分析数据

### 16. 获取趋势分析 (GET)
**目的**：获取用户收支趋势数据

**请求信息**：
- 方法：`GET`
- URL：`http://localhost:5000/api/analytics/trend/YOUR_USER_ID`
- 请求头：无特殊要求

**预期响应**：
- 状态码：`200 OK`
- 响应体：收支趋势分析数据

## 演示流程建议

1. **初始化阶段**
   - 运行后端服务
   - 注册新用户（演示POST操作）
   - 登录获取用户信息

2. **账户管理演示**
   - 添加新账户（POST）
   - 查询账户列表（GET）
   - 更新账户信息（PUT）

3. **账单管理演示**
   - 添加收入账单（POST，type=income）
   - 添加支出账单（POST，type=expense）
   - 查询所有账单（GET）
   - 使用筛选条件查询（GET + 参数）
   - 更新账单信息（PUT）
   - 删除账单（DELETE）

4. **预算管理演示**
   - 设置月度预算（POST）
   - 查询预算（GET）
   - 更新预算金额（PUT）

5. **高级功能演示**
   - 获取数据分析报告
   - 展示数据关联（如账单如何影响账户余额）

## 注意事项

1. 请确保将所有 `YOUR_USER_ID`、`ACCOUNT_ID`、`BILL_ID`、`BUDGET_ID` 替换为实际值
2. 所有API都返回JSON格式数据
3. 操作成功时，`success` 字段值为 `true`
4. 错误情况下，会返回 `success: false` 和具体的错误信息
5. 删除账户前，请确保该账户没有关联的账单记录

祝您演示顺利！