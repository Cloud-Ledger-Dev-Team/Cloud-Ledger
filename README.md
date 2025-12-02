# Cloud-Ledger

## 项目简介
本项目是一个基于 Python 的 Web 账本应用，支持多账户资产的增删改查与分类管理，实时统计资金流向并生成报表，为用户提供清晰简洁的理财工具。

## 项目结构

```
Cloud-Ledger/
├── .gitignore                     # Git忽略文件
├── README.md                      # 项目说明文档
├── controllers/                   # 控制器层，处理业务逻辑
│   ├── account_controller.py      # 账户管理控制器
│   ├── app.py                     # Flask应用实例
│   ├── bill_controller.py         # 账单管理控制器
│   ├── budget_controller.py       # 预算管理控制器
│   ├── category_controller.py     # 分类管理控制器
│   ├── main.py                    # 控制器入口
│   ├── report_controller.py       # 报表生成控制器
│   ├── transaction_controller.py  # 交易记录控制器
│   └── user_controller.py         # 用户管理控制器
├── docs/                          # 文档目录
│   ├── E-R图.png                  # 实体关系图
│   ├── 功能模块.png               # 功能模块图
│   ├── 功能模块.pptx              # 功能模块演示文稿
│   └── 架构图.jpg                 # 系统架构图
├── main.py                        # 应用主入口文件
├── models/                        # 数据相关文件
│   ├── cloud_ledger.db            # SQLite数据库文件
│   ├── database_models.py         # 数据库模型定义
│   ├── financial_functions.sql    # 财务功能SQL脚本
│   ├── init_db.py                 # 数据库初始化脚本
│   ├── init_db_fix.py             # 数据库初始化修复脚本
│   ├── repair_database.py         # 数据库修复脚本
│   ├── sql.sql                    # 数据库初始化SQL脚本
│   └── verify_database.py         # 数据库验证脚本
├── requirements.txt               # 项目依赖文件
├── tests/                         # 测试脚本目录
│   ├── POSTMAN测试指南.md         # API测试指南
│   ├── auth_test.html             # 认证测试页面
│   ├── e2e_test.js                # 端到端测试脚本
│   ├── test_all_crud.ps1          # 全CRUD测试脚本
│   ├── test_api.js                # API测试脚本
│   ├── test_crud_en.ps1           # 英文CRUD测试脚本
│   ├── test_login.py              # 登录测试脚本
│   ├── test_logout.js             # 登出测试脚本
│   ├── test_popup.js              # 弹窗测试脚本
│   ├── test_scripts.ps1           # 测试脚本集合
│   └── test_select.sql            # 选择查询测试
└── views/                         # 视图层，前端文件
    ├── account.js                 # 账户管理脚本
    ├── app.js                     # 前端主脚本
    ├── auth.js                    # 认证管理脚本
    ├── bill.js                    # 账单管理脚本
    ├── cloud_ledger.html          # 主页面
    ├── cloud_ledger_bgi.png       # 背景图片
    ├── database.js                # 数据库交互脚本
    ├── login_register.html        # 登录注册页面
    ├── main.js                    # 核心逻辑脚本
    ├── modal.js                   # 弹窗管理脚本
    ├── navigation.js              # 导航管理脚本
    ├── stat.js                    # 统计功能脚本
    ├── styles.css                 # 样式文件
    └── utils.js                   # 工具函数脚本
```

## 技术栈

- **后端**：Python 3.x, Flask 2.2.3, SQLAlchemy 2.0.4
- **数据库**：SQLite
- **前端**：HTML, CSS, JavaScript

## 安装与运行

### 1. 安装依赖

在项目根目录下运行：
```bash
pip install -r requirements.txt
```

### 2. 初始化数据库

```bash
python models/init_db.py
```

### 3. 运行应用

```bash
python main.py
```

应用将在 http://localhost:5000 启动。

## 主要功能模块

### 1. 用户管理
- 用户注册与登录
- 用户认证与会话管理
- 新用户默认账户自动创建

### 2. 账户管理
- 创建多类型账户（现金、银行卡、电子钱包等）
- 查看账户列表及余额概览
- 更新账户信息与余额
- 删除闲置账户

### 3. 账单管理
- 添加收支记录（支持多种收支类型）
- 账单列表查询（支持按用户、日期、金额等条件筛选）
- 修改账单详情
- 删除错误记录
- 自动关联并更新对应账户余额

### 4. 预算管理
- 设置月度总预算与分类预算
- 查询当月预算使用情况
- 动态调整预算金额
- 预算超支预警

### 5. 分类管理
- 预设常用收支分类
- 支持自定义分类
- 分类统计与分析

### 6. 数据分析与报表
- 月度财务统计（总收入、总支出、结余等）
- 多月份收支趋势对比分析
- 分类支出占比可视化
- 预算执行情况报告

### 7. 交易记录管理
- 自动记录所有账户变动历史
- 交易详情查询
- 交易关联分析

## API 接口说明

### 用户接口
- `POST /api/register` - 用户注册
  - 参数：`username`, `email`, `password`
  - 返回：用户信息和访问令牌
- `POST /api/login` - 用户登录
  - 参数：`email`, `password`
  - 返回：用户信息和访问令牌

### 账户接口
- `GET /api/accounts` - 获取账户列表
  - 查询参数：`user_id`
  - 返回：账户列表
- `POST /api/accounts` - 创建账户
  - 参数：`user_id`, `name`, `type`, `balance`, `description`
  - 返回：创建的账户信息
- `PUT /api/accounts/<account_id>` - 更新账户
  - 参数：`name`, `type`, `balance`, `description`（可选）
  - 返回：更新后的账户信息
- `DELETE /api/accounts/<account_id>` - 删除账户
  - 返回：操作结果

### 账单接口
- `GET /api/bills` - 获取账单列表
  - 查询参数：`user_id`（必填）, `start_date`, `end_date`, `category`
  - 返回：符合条件的账单列表
- `POST /api/bills` - 创建账单
  - 参数：`user_id`, `account_id`, `amount`, `type`(income/expense), `category_id`, `description`, `date`
  - 返回：创建的账单信息
- `PUT /api/bills/<bill_id>` - 更新账单
  - 参数：`amount`, `type`, `category_id`, `description`, `date`（可选）
  - 返回：更新后的账单信息
- `DELETE /api/bills/<bill_id>` - 删除账单
  - 返回：操作结果

### 预算接口
- `POST /api/budgets` - 设置预算
  - 参数：`user_id`, `amount`, `month`, `category_id`（可选）
  - 返回：创建的预算信息
- `GET /api/budgets/<user_id>/<month>` - 获取预算
  - 返回：指定月份的预算信息
- `PUT /api/budgets/<budget_id>` - 更新预算
  - 参数：`amount`
  - 返回：更新后的预算信息

### 分类接口
- `GET /api/categories` - 获取分类列表
  - 返回：所有可用分类

### 分析接口
- `GET /api/analytics/monthly/<user_id>/<month>` - 获取月度统计
  - 返回：月度收支汇总、预算执行情况
- `GET /api/analytics/trend/<user_id>` - 获取支出趋势
  - 查询参数：`months`（默认6个月）
  - 返回：多月份支出趋势数据

### 交易接口
- `POST /api/transactions` - 添加交易记录
  - 参数：`source_account_id`, `target_account_id`, `amount`, `description`, `date`
  - 返回：交易记录信息
- `GET /api/transactions` - 获取交易记录
  - 查询参数：`account_id`, `start_date`, `end_date`
  - 返回：符合条件的交易记录列表

## 注意事项

1. 首次运行时，系统会自动创建必要的数据库表和基础模板文件
2. 请确保应用有足够权限访问 `views` 文件夹（应用的模板和静态文件目录）
3. 建议在生产环境中修改 `SECRET_KEY` 为强随机字符串
4. 本项目使用 SQLite 数据库，适合小型应用部署

## 使用指南

### 首次使用
1. 按照安装步骤完成环境配置和数据库初始化
2. 启动应用并访问 http://localhost:5000
3. 注册新用户账号
4. 系统会自动为新用户创建默认账户
5. 开始添加账单记录和设置预算

### 数据管理
- 定期备份 `models/cloud_ledger.db` 文件以防止数据丢失
- 通过管理界面可以方便地导入和导出账单数据

## 开发指南

### 环境配置
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/MacOS
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 数据库操作
- 数据库文件位于项目的 `models` 目录下的 `cloud_ledger.db`
- 使用 SQLAlchemy ORM 进行数据库操作
- 数据库模型定义在 `models/database_models.py` 中

### 前端开发
- 前端文件位于 `views` 目录
- 使用原生 JavaScript 和 CSS 开发
- 响应式设计，适配不同设备屏幕

## 部署建议

### 本地开发
- 使用 Flask 内置服务器进行开发测试
- 默认监听地址：http://localhost:5000

### 生产环境
- 推荐使用 Gunicorn 或 uWSGI 作为 WSGI 服务器
- 配合 Nginx 反向代理提供更好的性能和安全性
- 配置 HTTPS 确保数据传输安全
- 设置定期备份机制

## 功能扩展方向

1. 添加数据导入/导出功能（CSV、Excel格式）
2. 实现多用户协作记账功能
3. 开发移动端适配版本
4. 添加图表可视化功能
5. 实现更智能的预算分析和财务建议
