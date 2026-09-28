$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcnlieWVsdWlseW94cmF4a3V3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM4Nzc3OSwiZXhwIjoyMTAzOTYzNzc5fQ.N79KA4vNrC7fuMYnywFDYHfAd-lURH_py9I-Rt_qqdo"
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcnlieWVsdWlseW94cmF4a3V3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM4Nzc3OSwiZXhwIjoyMTAzOTYzNzc5fQ.N79KA4vNrC7fuMYnywFDYHfAd-lURH_py9I-Rt_qqdo"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}
# Using correct column names for payments table
$body = '{"order_id":"3c7bfbfb-86e3-4c6d-920f-8f3df6f918c8","user_id":"826a8100-b00a-42f4-aa6b-22233cb4d1e1","amount":99.99,"currency":"USD","method":"card","status":"paid"}'
Invoke-RestMethod -Uri "https://ofrybyeluilyoxraxkuw.supabase.co/rest/v1/payments" -Method Post -Headers $headers -Body $body