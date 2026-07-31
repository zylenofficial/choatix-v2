try {
    $response = Invoke-WebRequest -Uri 'https://choatix-v2.onrender.com/api/checkout' -Method Post -ContentType 'application/json' -Body '{"productId":"basic","discordUsername":"testuser"}'
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object IO.StreamReader $stream
        Write-Host "Response: $($reader.ReadToEnd())"
    }
}