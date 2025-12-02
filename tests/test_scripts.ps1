# 测试脚本 - 获取用户ID
$loginBody = @{email='test@example.com';password='password123'} | ConvertTo-Json
$loginResult = Invoke-RestMethod -Uri 'http://localhost:5000/api/login' -Method POST -ContentType 'application/json' -Body $loginBody

# 输出用户信息
Write-Output "登录成功，用户信息："
$loginResult | Format-List

# 提取用户ID并保存
$userId = $loginResult.user.user_id
Write-Output "用户ID: $userId"

# 保存用户ID到文件
$userId | Out-File -FilePath '.\current_user.txt' -Encoding utf8
Write-Output "用户ID已保存到 current_user.txt"