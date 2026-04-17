param(
  [string]$Namespace = "default"
)

$ErrorActionPreference = "Stop"

function Get-RequiredEnv {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Missing required environment variable: $Name"
  }
  return $value
}

function Get-OptionalEnv {
  param(
    [string]$Name,
    [string]$DefaultValue = ""
  )
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $DefaultValue
  }
  return $value
}

function Apply-Secret {
  param(
    [string]$Name,
    [hashtable]$Literals
  )

  $args = @(
    "create", "secret", "generic", $Name,
    "-n", $Namespace,
    "--dry-run=client",
    "-o", "yaml"
  )

  foreach ($key in $Literals.Keys) {
    $value = $Literals[$key]
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      $args += "--from-literal=$key=$value"
    }
  }

  $yaml = & kubectl @args
  $yaml | kubectl apply -f - | Out-Null
  Write-Host "Applied secret: $Name"
}

$jwtSecret = Get-RequiredEnv "JWT_SECRET"
$jwtExpiresIn = Get-OptionalEnv "JWT_EXPIRES_IN" "7d"

Apply-Secret "auth-service-secrets" @{
  MONGODB_URI = Get-RequiredEnv "AUTH_MONGODB_URI"
  JWT_SECRET = $jwtSecret
  JWT_EXPIRES_IN = $jwtExpiresIn
}

Apply-Secret "patient-service-secrets" @{
  MONGODB_URI = Get-RequiredEnv "PATIENT_MONGODB_URI"
  JWT_SECRET = $jwtSecret
}

Apply-Secret "doctor-service-secrets" @{
  MONGO_URI = Get-RequiredEnv "DOCTOR_MONGO_URI"
}

Apply-Secret "appointment-service-secrets" @{
  MONGODB_URI = Get-RequiredEnv "APPOINTMENT_MONGODB_URI"
  JWT_SECRET = $jwtSecret
}

Apply-Secret "payment-service-secrets" @{
  STRIPE_SECRET_KEY = Get-RequiredEnv "STRIPE_SECRET_KEY"
}

Apply-Secret "ai-service-secrets" @{
  GEMINI_API_KEY = Get-OptionalEnv "GEMINI_API_KEY" ""
}

$emailUser = Get-RequiredEnv "EMAIL_USER"
$emailProvider = Get-OptionalEnv "EMAIL_PROVIDER" "auto"
$emailFrom = Get-OptionalEnv "EMAIL_FROM" $emailUser
$twilioPhoneNumber = Get-OptionalEnv "TWILIO_PHONE_NUMBER" ""
if ([string]::IsNullOrWhiteSpace($twilioPhoneNumber)) {
  $twilioPhoneNumber = Get-OptionalEnv "TWILIO_PHONE_NUMBER_FROM" ""
}
if ([string]::IsNullOrWhiteSpace($twilioPhoneNumber)) {
  # Backward-compatible fallback for typoed key that may exist in local files.
  $twilioPhoneNumber = Get-OptionalEnv "TWILIO_PHONE_NUMBER_FRom" ""
}

Apply-Secret "notification-service-secrets" @{
  EMAIL_USER = $emailUser
  EMAIL_APP_PASSWORD = Get-RequiredEnv "EMAIL_APP_PASSWORD"
  EMAIL_PROVIDER = $emailProvider
  EMAIL_FROM = $emailFrom
  SENDGRID_API_KEY = Get-OptionalEnv "SENDGRID_API_KEY" ""
  TWILIO_ACCOUNT_SID = Get-OptionalEnv "TWILIO_ACCOUNT_SID" ""
  TWILIO_AUTH_TOKEN = Get-OptionalEnv "TWILIO_AUTH_TOKEN" ""
  TWILIO_PHONE_NUMBER = $twilioPhoneNumber
}

Write-Host "All Kubernetes secrets applied successfully in namespace '$Namespace'."
