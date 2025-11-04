# 完整的CRUD测试脚本
Write-Output "========================================"
Write-Output "测试 Cloud Ledger 数据库CRUD操作"
Write-Output "========================================"

# 1. 读取用户ID
$userId = Get-Content -Path '.\current_user.txt' -Raw
$userId = $userId.Trim()
Write-Output "使用用户ID: $userId"

# 2. 测试账户相关的CRUD操作
Write-Output "\n1. 测试账户操作 (CRUD)"
Write-Output "-------------------"

# 2.1 获取当前账户列表 (GET)
Write-Output "\n1.1 获取账户列表 (GET)"
try {
    $accounts = Invoke-RestMethod -Uri "http://localhost:5000/api/accounts?user_id=$userId" -Method GET
    Write-Output "账户列表获取成功，数量: $($accounts.accounts.Count)"
    $accounts.accounts | Format-List
} catch {
    Write-Output "获取账户列表失败: $_"
}

# 2.2 添加新账户 (POST)
Write-Output "\n1.2 添加新账户 (POST)"
try {
    $newAccount = @{
        user_id = $userId
        name = "测试账户"
        type = "银行卡"
        balance = 1000.00
    } | ConvertTo-Json
    
    $addedAccount = Invoke-RestMethod -Uri 'http://localhost:5000/api/accounts' -Method POST -ContentType 'application/json' -Body $newAccount
    $accountId = $addedAccount.account.account_id
    Write-Output "账户添加成功，账户ID: $accountId"
    $addedAccount | Format-List
} catch {
    Write-Output "添加账户失败: $_"
}

# 3. 测试账单相关的CRUD操作
Write-Output "\n2. 测试账单操作 (CRUD)"
Write-Output "-------------------"

# 3.1 添加新账单 (POST)
Write-Output "\n2.1 添加新账单 (POST)"
try {
    $newBill = @{
        user_id = $userId
        account_id = $accountId
        type = "expense"
        category = "餐饮"
        amount = 50.00
        date = Get-Date -Format 'yyyy-MM-dd'
        description = "测试账单"
    } | ConvertTo-Json
    
    $addedBill = Invoke-RestMethod -Uri 'http://localhost:5000/api/bills' -Method POST -ContentType 'application/json' -Body $newBill
    $billId = $addedBill.bill.bill_id
    Write-Output "账单添加成功，账单ID: $billId"
    $addedBill | Format-List
} catch {
    Write-Output "添加账单失败: $_"
}

# 3.2 获取账单列表 (GET)
Write-Output "\n2.2 获取账单列表 (GET)"
try {
    $bills = Invoke-RestMethod -Uri "http://localhost:5000/api/bills?user_id=$userId" -Method GET
    Write-Output "账单列表获取成功，数量: $($bills.bills.Count)"
    $bills.bills | Format-List
} catch {
    Write-Output "获取账单列表失败: $_"
}

# 3.3 更新账单 (PUT)
Write-Output "\n2.3 更新账单 (PUT)"
try {
    $updateBill = @{
        amount = 100.00
        description = "更新后的测试账单"
    } | ConvertTo-Json
    
    $updatedBill = Invoke-RestMethod -Uri "http://localhost:5000/api/bills/$billId" -Method PUT -ContentType 'application/json' -Body $updateBill
    Write-Output "账单更新成功"
    $updatedBill | Format-List
} catch {
    Write-Output "更新账单失败: $_"
}

# 3.4 更新账户 (PUT)
Write-Output "\n1.3 更新账户 (PUT)"
try {
    $updateAccount = @{
        name = "更新后的测试账户"
        balance = 2000.00
    } | ConvertTo-Json
    
    $updatedAccount = Invoke-RestMethod -Uri "http://localhost:5000/api/accounts/$accountId" -Method PUT -ContentType 'application/json' -Body $updateAccount
    Write-Output "账户更新成功"
    $updatedAccount | Format-List
} catch {
    Write-Output "更新账户失败: $_"
}

# 4. 测试删除操作 (DELETE)
Write-Output "\n3. 测试删除操作 (DELETE)"
Write-Output "-------------------"

# 4.1 删除账单 (DELETE)
Write-Output "\n3.1 删除账单 (DELETE)"
try {
    $deleteBillResult = Invoke-RestMethod -Uri "http://localhost:5000/api/bills/$billId" -Method DELETE
    Write-Output "账单删除成功"
    $deleteBillResult | Format-List
} catch {
    Write-Output "删除账单失败: $_"
}

# 4.2 删除账户 (DELETE)
Write-Output "\n3.2 删除账户 (DELETE)"
try {
    $deleteAccountResult = Invoke-RestMethod -Uri "http://localhost:5000/api/accounts/$accountId" -Method DELETE
    Write-Output "账户删除成功"
    $deleteAccountResult | Format-List
} catch {
    Write-Output "删除账户失败: $_"
}

Write-Output "\n========================================"
Write-Output "CRUD操作测试完成！"
Write-Output "========================================"