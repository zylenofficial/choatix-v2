$files = Get-ChildItem C:\Users\evald\Desktop\choatix-v2\docs\*.html
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $new = $content -replace 'https://github\.com/zylenofficial/choatix-v2/releases/latest', 'download.html'
    Set-Content -Path $file.FullName -Value $new
}