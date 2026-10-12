# ============================================================
# 分类接口专项验证：编码一致性 + 数据唯一性
# 覆盖：GET /api/categories（未登录/登录）、POST/DELETE 自定义分类、
#       服务端去重防御、Redis 缓存编码、数据库唯一性、幂等重跑
# 运行前提：后端 8080、MySQL、Redis 均已启动
# ============================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$Base = "http://localhost:8080"
# MySQL 凭证：通过环境变量 MYSQL_PWD 注入（mysql 客户端原生支持），避免明文硬编码进脚本
# 运行前请先执行：$env:MYSQL_PWD = "你的MySQL密码"（未设置时使用下方占位符）
if (-not $env:MYSQL_PWD) { $env:MYSQL_PWD = "你的MySQL密码" }
$MySQL = "mysql -uroot --default-character-set=utf8mb4 -N cloud_ledger"
$expectedNames = @("工资","奖金","投资收益","兼职收入","礼金","其他收入",
                   "餐饮","交通","购物","娱乐","医疗","教育","房租","水电煤气","通讯费","生活费","其他支出")

$pass = 0; $total = 0
function Assert($cond, $caseName, $detail) {
    $script:total++
    if ($cond) { $script:pass++; Write-Output ("[通过] " + $caseName) }
    else { Write-Output ("[失败] " + $caseName + " => " + $detail) }
}

# 通过 cmd 执行 mysql：规避 PowerShell 5.1 将原生 stderr 警告升级为终止错误的已知问题
function Invoke-Mysql($sql) {
    return cmd /c "mysql -uroot --default-character-set=utf8mb4 -N cloud_ledger -e `"$sql`" 2>nul"
}

# 统一以 UTF-8 读取响应体（PowerShell 5.1 对无 charset 的 application/json 默认按
# ISO-8859-1 解码，会制造"假乱码"，因此显式按 UTF-8 解码后再 ConvertFrom-Json）
function Get-Json($url, $method = "GET", $token = $null, $body = $null) {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.Method = $method
    $req.ContentType = "application/json; charset=utf-8"
    if ($token) { $req.Headers.Add("Authorization", "Bearer $token") }
    if ($body -ne $null) {
        $bytes = [Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Compress))
        $stream = $req.GetRequestStream()
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Close()
    }
    try {
        $resp = $req.GetResponse()
        $reader = New-Object IO.StreamReader($resp.GetResponseStream(), [Text.Encoding]::UTF8)
        $text = $reader.ReadToEnd()
        $reader.Close(); $resp.Close()
        return (ConvertFrom-Json $text)
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($resp) {
            $reader = New-Object IO.StreamReader($resp.GetResponseStream(), [Text.Encoding]::UTF8)
            $text = $reader.ReadToEnd(); $reader.Close(); $resp.Close()
            return (ConvertFrom-Json $text)
        }
        throw
    }
}

Write-Output "============================================================"
Write-Output " 场景 A：未登录获取分类列表（预设 17 条）"
Write-Output "============================================================"
$a = Get-Json "$Base/api/categories"
$presetList = @($a.data.categories)
Assert ($a.code -eq 200) "A1 未登录返回 code=200" "code=$($a.code)"
Assert ($presetList.Count -eq 17) "A2 预设分类数量为 17" "实际 $($presetList.Count)"
$hasMojibake = ($presetList | Where-Object { $expectedNames -notcontains $_.name }).Count
Assert ($hasMojibake -eq 0) "A3 无乱码（全部命中预期中文名清单）" "异常项: $($presetList | Where-Object { $expectedNames -notcontains $_.name } | ForEach-Object name)"
$dupKeys = $presetList | Group-Object { "$($_.user_id)|$($_.name)|$($_.type)" } | Where-Object Count -gt 1
Assert ($dupKeys.Count -eq 0) "A4 无重复数据（user_id+name+type 唯一）" "重复组: $($dupKeys.Name)"
$groupNames = @(); $a.data.groups.PSObject.Properties | ForEach-Object { $groupNames += $_.Value }
Assert (($groupNames | Measure-Object).Count -eq 17 -and (($groupNames | Group-Object | Where-Object Count -gt 1).Count -eq 0)) "A5 groups 分组名称无重复且共 17 个" "groups 总数 $(($groupNames | Measure-Object).Count)"

Write-Output ""
Write-Output "============================================================"
Write-Output " 场景 B：响应编码一致性"
Write-Output "============================================================"
$req = [System.Net.HttpWebRequest]::Create("$Base/api/categories")
$resp = $req.GetResponse()
$ct = $resp.ContentType
$resp.Close()
Assert ($ct -match "application/json") "B1 Content-Type 为 application/json" "$ct"
$hexName = Invoke-Mysql "SELECT HEX(name) FROM category WHERE type='expense' AND user_id IS NULL AND sort_order=7"
Assert ($hexName -eq "E9A490E9A5AE") "B2 数据库存储为标准 UTF-8（餐饮 HEX=E9A490E9A5AE）" "HEX=$hexName"

Write-Output ""
Write-Output "============================================================"
Write-Output " 场景 C：登录态全流程（注册→登录→增→冲突→删）"
Write-Output "============================================================"
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "verify_cat_$stamp@test.com"
$reg = Get-Json "$Base/api/register" "POST" $null @{ name = "分类验证员"; email = $email; password = "Test@12345" }
if ($reg.code -ne 200) { Write-Output "注册失败: $($reg.msg)，尝试直接登录" }
$login = Get-Json "$Base/api/login" "POST" $null @{ email = $email; password = "Test@12345" }
Assert ($login.code -eq 200 -and $login.data.token) "C1 临时用户注册并登录成功" "code=$($login.code) msg=$($login.msg)"
$token = $login.data.token

$lc = Get-Json "$Base/api/categories" "GET" $token
Assert (@($lc.data.categories).Count -eq 17) "C2 登录后列表仍为 17 条预设" "实际 $(@($lc.data.categories).Count)"

$createBody = @{ name = "宠物用品"; type = "expense"; icon = "Grid"; color = "#67C23A" }
$cr = Get-Json "$Base/api/categories" "POST" $token $createBody
Assert ($cr.code -eq 200 -and $cr.data.name -eq "宠物用品") "C3 创建自定义分类成功且中文名无乱码" "code=$($cr.code) name=$($cr.data.name)"

$lc2 = Get-Json "$Base/api/categories" "GET" $token
$customItems = @($lc2.data.categories) | Where-Object { $null -ne $_.user_id }
$customCount = @($customItems).Count
$customNameOk = ($customCount -eq 1 -and $customItems[0].name -eq "宠物用品")
Assert ($customCount -eq 1 -and @($lc2.data.categories).Count -eq 18 -and $customNameOk) "C4 列表含 1 条自定义分类共 18 条且无重复" "自定义 x$customCount, name=$($customItems[0].name), 总数 $(@($lc2.data.categories).Count)"

$dup = Get-Json "$Base/api/categories" "POST" $token $createBody
Assert ($dup.code -eq 409) "C5 同类型重复创建返回 409 冲突" "code=$($dup.code) msg=$($dup.msg)"

$anonCreate = Get-Json "$Base/api/categories" "POST" $null $createBody
Assert ($anonCreate.code -eq 401) "C6 未登录创建分类被拒绝（401）" "code=$($anonCreate.code)"

$delId = $cr.data.id
$dr = Get-Json "$Base/api/categories/$delId" "DELETE" $token
$lc3 = Get-Json "$Base/api/categories" "GET" $token
Assert ($dr.code -eq 200 -and @($lc3.data.categories).Count -eq 17) "C7 删除自定义分类后恢复 17 条" "总数 $(@($lc3.data.categories).Count)"

Write-Output ""
Write-Output "============================================================"
Write-Output " 场景 D：服务端去重防御（注入脏数据仍返回唯一）"
Write-Output "============================================================"
Invoke-Mysql "INSERT INTO category (name, type) VALUES (CONVERT(0xE9A490E9AEE5 USING utf8mb4), 'expense');" | Out-Null
& redis-cli DEL "cloud-ledger:category:list:system" | Out-Null
$dc = Get-Json "$Base/api/categories"
$dNames = @($dc.data.categories) | Where-Object { $_.name -eq "餐饮" }
Assert (@($dc.data.categories).Count -eq 17 -and @($dNames).Count -eq 1) "D1 数据库存在重复脏行时接口仍返回 17 条且餐饮唯一" "总数 $(@($dc.data.categories).Count), 餐饮 x$(@($dNames).Count)"
Invoke-Mysql "DELETE FROM category WHERE user_id IS NULL AND type='expense' AND name=CONVERT(0xE9A490E9AEE5 USING utf8mb4) AND id <> 7;" | Out-Null
& redis-cli DEL "cloud-ledger:category:list:system" | Out-Null
$dc2 = Get-Json "$Base/api/categories"
Assert (@($dc2.data.categories).Count -eq 17) "D2 脏数据清理后恢复 17 条" "总数 $(@($dc2.data.categories).Count)"

Write-Output ""
Write-Output "============================================================"
Write-Output " 场景 E：Redis 缓存编码一致性"
Write-Output "============================================================"
Get-Json "$Base/api/categories" | Out-Null   # 确保缓存已回填
$cached = & redis-cli --no-raw GET "cloud-ledger:category:list:system" 2>$null
Assert ($cached -match "\\xe9\\xa4\\x90") "E1 缓存值为合法 UTF-8 字节（含 餐=E9A490）" "缓存样本: $($cached.Substring(0, [Math]::Min(80, $cached.Length)))"

Write-Output ""
Write-Output "============================================================"
Write-Output " 场景 G：排序自动生成 / 参数校验 / 预设删除拦截 / 来源归属"
Write-Output "============================================================"
# G1: 不带 sort_order 创建 → 自动生成（该用户 expense 当前 max+1 = 1）
$g1 = Get-Json "$Base/api/categories" "POST" $token @{ name = "G自动排序一"; type = "expense" }
Assert ($g1.code -eq 200 -and $g1.data.sort_order -eq 1) "G1 不带 sort_order 创建自动生成为 1" "code=$($g1.code) sort_order=$($g1.data.sort_order)"
# G2: 再次不带 sort_order → 2（max+1 追加到末尾）
$g2 = Get-Json "$Base/api/categories" "POST" $token @{ name = "G自动排序二"; type = "expense" }
Assert ($g2.code -eq 200 -and $g2.data.sort_order -eq 2) "G2 二次创建自动生成为 2" "code=$($g2.code) sort_order=$($g2.data.sort_order)"
# G3: sort_order 传字符串 → 400
$g3 = Get-Json "$Base/api/categories" "POST" $token @{ name = "G非法排序"; type = "expense"; sort_order = "abc" }
Assert ($g3.code -eq 400) "G3 sort_order 非数字返回 400" "code=$($g3.code) msg=$($g3.msg)"
# G4: sort_order 超范围 → 400
$g4 = Get-Json "$Base/api/categories" "POST" $token @{ name = "G越界排序"; type = "expense"; sort_order = 100000 }
Assert ($g4.code -eq 400) "G4 sort_order 超范围返回 400" "code=$($g4.code) msg=$($g4.msg)"
# G5: 删除系统预设分类 → 403
$g5 = Get-Json "$Base/api/categories/7" "DELETE" $token
Assert ($g5.code -eq 403) "G5 删除系统预设分类被拦截（403）" "code=$($g5.code) msg=$($g5.msg)"
# G6: 来源归属：user_id = 创建者（非系统预设）
$g6Ok = ($g2.data.user_id -ne $null -and $g2.data.user_id -eq $login.data.user.user_id)
Assert $g6Ok "G6 新增分类 user_id 归属创建者（用户自定义）" "user_id=$($g2.data.user_id)"
# 清理 G 场景数据（由下方统一清理步骤处理 verify_cat_ 用户）

Write-Output ""
Write-Output "============================================================"
Write-Output " 清理历史测试残留（临时用户及其自定义分类）"
Write-Output "============================================================"
Invoke-Mysql "DELETE FROM category WHERE user_id IN (SELECT user_id FROM user WHERE email LIKE 'verify_cat_%@test.com' OR email LIKE 'dbg_%@test.com');" | Out-Null
Invoke-Mysql "DELETE FROM user WHERE email LIKE 'verify_cat_%@test.com' OR email LIKE 'dbg_%@test.com';" | Out-Null
Get-Json "$Base/api/categories" | Out-Null
Write-Output "残留清理完成"

Write-Output ""
Write-Output "============================================================"
Write-Output " 场景 F：数据库层面唯一性核查"
Write-Output "============================================================"
$dupRows = Invoke-Mysql "SELECT COUNT(*) FROM (SELECT user_id, name, type, COUNT(*) c FROM category GROUP BY user_id, name, type HAVING c > 1) t"
$presetRows = Invoke-Mysql "SELECT COUNT(*) FROM category WHERE user_id IS NULL"
Assert ($dupRows -eq "0" -and $presetRows -eq "17") "F1 预设分类恒为 17 条且全表无重复（user_id+name+type，总数可随用户创建增长）" "重复组 $dupRows, 预设 $presetRows"

Write-Output ""
Write-Output "============================================================"
Write-Output "【汇总】 $pass/$total 用例通过"
Write-Output "============================================================"
if ($pass -lt $total) { exit 1 }
