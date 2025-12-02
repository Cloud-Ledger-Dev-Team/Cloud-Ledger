# Simple CRUD Test Script (English Version)
Write-Output "========================================"
Write-Output "Testing Cloud Ledger Database CRUD Operations"
Write-Output "========================================"

# 1. Read user ID
$userId = Get-Content -Path '.\current_user.txt' -Raw
$userId = $userId.Trim()
Write-Output "Using User ID: $userId"

# 2. Test Account POST - Create
Write-Output "\n1. Testing Account POST (Create)"
try {
    $newAccountJson = '{"user_id":"' + $userId + '","name":"Test Account","type":"Bank Card","balance":1000.00}'
    $addedAccount = Invoke-RestMethod -Uri 'http://localhost:5000/api/accounts' -Method POST -ContentType 'application/json' -Body $newAccountJson
    $accountId = $addedAccount.account.account_id
    Write-Output "Account created successfully with ID: $accountId"
} catch {
    Write-Output "Failed to create account: $_"
}

# 3. Test Account GET - Read
Write-Output "\n2. Testing Account GET (Read)"
try {
    $accounts = Invoke-RestMethod -Uri "http://localhost:5000/api/accounts?user_id=$userId" -Method GET
    Write-Output "Accounts retrieved successfully. Count: $($accounts.accounts.Count)"
} catch {
    Write-Output "Failed to get accounts: $_"
}

# 4. Test Account PUT - Update
Write-Output "\n3. Testing Account PUT (Update)"
try {
    $updateAccountJson = '{"name":"Updated Account","balance":2000.00}'
    $updatedAccount = Invoke-RestMethod -Uri "http://localhost:5000/api/accounts/$accountId" -Method PUT -ContentType 'application/json' -Body $updateAccountJson
    Write-Output "Account updated successfully"
} catch {
    Write-Output "Failed to update account: $_"
}

# 5. Test Bill POST - Create
Write-Output "\n4. Testing Bill POST (Create)"
try {
    $today = Get-Date -Format 'yyyy-MM-dd'
    $newBillJson = '{"user_id":"' + $userId + '","account_id":"' + $accountId + '","type":"expense","category":"Food","amount":50.00,"date":"' + $today + '","description":"Test Bill"}'
    $addedBill = Invoke-RestMethod -Uri 'http://localhost:5000/api/bills' -Method POST -ContentType 'application/json' -Body $newBillJson
    $billId = $addedBill.bill.bill_id
    Write-Output "Bill created successfully with ID: $billId"
} catch {
    Write-Output "Failed to create bill: $_"
}

# 6. Test Bill GET - Read
Write-Output "\n5. Testing Bill GET (Read)"
try {
    $bills = Invoke-RestMethod -Uri "http://localhost:5000/api/bills?user_id=$userId" -Method GET
    Write-Output "Bills retrieved successfully. Count: $($bills.bills.Count)"
} catch {
    Write-Output "Failed to get bills: $_"
}

# 7. Test Bill PUT - Update
Write-Output "\n6. Testing Bill PUT (Update)"
try {
    $updateBillJson = '{"amount":100.00,"description":"Updated Test Bill"}'
    $updatedBill = Invoke-RestMethod -Uri "http://localhost:5000/api/bills/$billId" -Method PUT -ContentType 'application/json' -Body $updateBillJson
    Write-Output "Bill updated successfully"
} catch {
    Write-Output "Failed to update bill: $_"
}

# 8. Test Bill DELETE
Write-Output "\n7. Testing Bill DELETE"
try {
    $deleteBillResult = Invoke-RestMethod -Uri "http://localhost:5000/api/bills/$billId" -Method DELETE
    Write-Output "Bill deleted successfully"
} catch {
    Write-Output "Failed to delete bill: $_"
}

# 9. Test Account DELETE
Write-Output "\n8. Testing Account DELETE"
try {
    $deleteAccountResult = Invoke-RestMethod -Uri "http://localhost:5000/api/accounts/$accountId" -Method DELETE
    Write-Output "Account deleted successfully"
} catch {
    Write-Output "Failed to delete account: $_"
}

Write-Output "\n========================================"
Write-Output "CRUD Operations Test Completed!"
Write-Output "========================================"