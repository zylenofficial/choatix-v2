$ids = @('1nQQuwAsU7zN3NZjVbhAVnW25fHkEqH5D','1mjhxk5tHmwcQbBzgJOczbMdO8mLa9UZ8','17BQS4j3yaqaRWiRm_pNfj_coJRr9TdYo','1TqpIVFWW6WNRZUpDCG2kZiVsHCGG1FGf')
foreach($id in $ids) {
    $url = "https://drive.google.com/uc?export=download&id=$id"
    $r = Invoke-WebRequest -Uri $url -Method Head
    Write-Host "$id : $($r.StatusCode) $($r.StatusDescription)"
}