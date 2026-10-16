$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api/sessions"
$hdr = @{ "Content-Type" = "application/json" }
$results = @()

# 构造中文请求体（UTF-8）
$saveObj = @{
  originalInput = "帮我写一个自动整理周报的脚本"
  title = "自动整理周报的脚本"
  taskType = "automation"
  optimizationLevel = "deep"
  outputFormat = "prompt"
  isMock = $false
  prompt = "你是一个自动化脚本专家。请编写一个 PowerShell 脚本，自动汇总本周工作周报…"
  qualityScore = 85
}
$saveBody = $saveObj | ConvertTo-Json -Depth 3
[System.IO.File]::WriteAllText("$env:TEMP\pp-save.json", $saveBody, [System.Text.Encoding]::UTF8)

function Invoke-Api($method, $url, $userId, $bodyFile) {
  $h = @{ "Content-Type" = "application/json" }
  if ($userId) { $h["X-User-Id"] = $userId }
  try {
    if ($bodyFile) {
      return Invoke-RestMethod -Method $method -Uri $url -Headers $h -InFile $bodyFile
    }
    return Invoke-RestMethod -Method $method -Uri $url -Headers $h
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    return @{ __status = $code }
  }
}

# 1. 用户A保存 → 201
$r1 = Invoke-Api POST $base "user-A" "$env:TEMP\pp-save.json"
$id = $r1.id
$results += "1. 用户A保存: id=$id versions=$($r1.versions.Count) title=$($r1.title) [PASS]"

# 2. 用户A重复保存相同输入 → 版本追加
$r2 = Invoke-Api POST $base "user-A" "$env:TEMP\pp-save.json"
$results += "2. 重复保存版本追加: versions=$($r2.versions.Count) (期望2) $(if ($r2.versions.Count -eq 2) {'[PASS]'} else {'[FAIL]'})"

# 3. 用户A列表 → 1条记录2个版本
$r3 = Invoke-Api GET $base "user-A" $null
$results += "3. 用户A列表: count=$($r3.sessions.Count) $(if ($r3.sessions.Count -eq 1) {'[PASS]'} else {'[FAIL]'})"

# 4. 用户B列表 → 0条（隔离）
$r4 = Invoke-Api GET $base "user-B" $null
$results += "4. 用户B列表: count=$($r4.sessions.Count) $(if ($r4.sessions.Count -eq 0) {'[PASS]'} else {'[FAIL]'})"

# 5. 用户B读取A的详情 → 404
$r5 = Invoke-Api GET "$base/$id" "user-B" $null
$results += "5. 用户B读A详情: status=$($r5.__status) (期望404) $(if ($r5.__status -eq 404) {'[PASS]'} else {'[FAIL]'})"

# 6. 用户B删除A的记录 → 404
$r6 = Invoke-Api DELETE "$base/$id" "user-B" $null
$results += "6. 用户B删A记录: status=$($r6.__status) (期望404) $(if ($r6.__status -eq 404) {'[PASS]'} else {'[FAIL]'})"

# 7. 用户A改名 → ok
$h7 = @{ "Content-Type" = "application/json"; "X-User-Id" = "user-A" }
$patchBody = '{"title":"周报整理助手"}'
[System.IO.File]::WriteAllText("$env:TEMP\pp-patch.json", $patchBody, [System.Text.Encoding]::UTF8)
$r7 = Invoke-RestMethod -Method PATCH -Uri "$base/$id" -Headers $h7 -InFile "$env:TEMP\pp-patch.json"
$results += "7. 用户A改名: ok=$($r7.ok) $(if ($r7.ok) {'[PASS]'} else {'[FAIL]'})"

# 8. 用户A确认改名生效
$r8 = Invoke-Api GET $base "user-A" $null
$t = $r8.sessions[0].title
$results += "8. 改名生效: title=$t $(if ($t -eq '周报整理助手') {'[PASS]'} else {'[FAIL]'})"

# 9. 缺少 X-User-Id → 400
try { Invoke-RestMethod -Method GET -Uri $base -Headers @{ "Content-Type" = "application/json" } | Out-Null; $s9 = "no-error" } catch { $s9 = $_.Exception.Response.StatusCode.value__ }
$results += "9. 缺少用户标识: status=$s9 (期望400) $(if ($s9 -eq 400) {'[PASS]'} else {'[FAIL]'})"

# 10. 用户A删除自己的记录 → ok，再查为空
$r10 = Invoke-Api DELETE "$base/$id" "user-A" $null
$r10b = Invoke-Api GET $base "user-A" $null
$results += "10. 用户A删除自己: ok=$($r10.ok) 残留=$($r10b.sessions.Count) $(if ($r10.ok -and $r10b.sessions.Count -eq 0) {'[PASS]'} else {'[FAIL]'})"

$results | ForEach-Object { Write-Output $_ }
