#to run:   powershell -ExecutionPolicy Bypass -File .\deploy.ps1

<#
.SYNOPSIS
    Automated deployment script for FinalProject - Builds and uploads to FTP server.
#>
$ErrorActionPreference = "Stop"

# Determine script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Configuration
$ftpServer = "ftp://194.90.158.74"
$ftpUser = "cgroup4"
$ftpPass = "cgroup4_12818"
$serverOutputPath = "Server/publish"
$serverFtpPath = "/test2/tar1/"
$clientDistPath = "ClientSide/dist"
$clientFtpPath = "/test2/tar2/FinalProject/"
function Upload-FolderToFtp {
    param(
        [string]$LocalFolder,
        [string]$FtpBasePath,
        [string]$FtpUsername,
        [string]$FtpPassword
    )

    if (-not (Test-Path $LocalFolder)) {
        throw "Local folder not found: $LocalFolder"
    }

    $resolvedLocalFolder = (Resolve-Path $LocalFolder).Path
    $files = Get-ChildItem -Path $LocalFolder -Recurse -File
    $total = $files.Count
    $current = 0

    # Ensure base URI format is clean
    $baseUri = $FtpBasePath
    if (-not $baseUri.EndsWith('/')) { $baseUri += '/' }
    
    $credentials = New-Object System.Net.NetworkCredential($FtpUsername, $FtpPassword)
    $createdDirs = @()

    foreach ($file in $files) {
        $current++
        
        $relativePath = $file.FullName.Substring($resolvedLocalFolder.Length).TrimStart('\')
        
        # Split local paths cleanly by backslashes to process individual folder levels
        $parts = $relativePath -split '\\'
        
        # Build the URL-encoded target paths segment-by-segment
        $encodedSegments = @()
        for ($i = 0; $i -lt ($parts.Count - 1); $i++) {
            $encodedSegments += [Uri]::EscapeDataString($parts[$i])
        }
        $encodedFileName = [Uri]::EscapeDataString($parts[-1])
        
        # Reconstruct the final safe target URL
        $targetFtpUrl = $baseUri + ($encodedSegments -join '/')
        if ($encodedSegments.Count -gt 0) { $targetFtpUrl += '/' }
        $targetFtpUrl += $encodedFileName

        # Walk through the directory tree sequentially to verify/create subfolders
        if ($encodedSegments.Count -gt 0) {
            $progressPathSegments = @()
            $progressRawSegments = @()

            for ($i = 0; $i -lt $encodedSegments.Count; $i++) {
                $progressPathSegments += $encodedSegments[$i]
                $progressRawSegments += $parts[$i]
                
                $currentProgressRaw = $progressRawSegments -join '/'

                if ($currentProgressRaw -notin $createdDirs) {
                    try {
                        $dirUrl = $baseUri + ($progressPathSegments -join '/')
                        
                        $dirRequest = [System.Net.FtpWebRequest]::Create($dirUrl)
                        $dirRequest.Credentials = $credentials
                        $dirRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                        
                        $dirResponse = $dirRequest.GetResponse()
                        $dirResponse.Close()
                        
                        $createdDirs += $currentProgressRaw
                    }
                    catch {
                        # Code 550 means the directory already exists on the server
                        if ($_.Exception.InnerException -and $_.Exception.InnerException.Message -like "*550*") {
                            $createdDirs += $currentProgressRaw
                        } else {
                            Write-Warning "Failed to verify or create directory '$currentProgressRaw': $_"
                        }
                    }
                }
            }
        }

        # Stream the file using a persistent payload array
        try {
            $uploadRequest = [System.Net.FtpWebRequest]::Create($targetFtpUrl)
            $uploadRequest.Credentials = $credentials
            $uploadRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            
            $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $uploadRequest.ContentLength = $fileBytes.Length
            
            $requestStream = $uploadRequest.GetRequestStream()
            $requestStream.Write($fileBytes, 0, $fileBytes.Length)
            $requestStream.Close()
            
            $uploadResponse = $uploadRequest.GetResponse()
            $uploadResponse.Close()
            
            Write-Host "Uploaded ($current/$total): $relativePath"
        }
        catch {
            Write-Warning "Upload failed for $relativePath - $_"
        }
    }
}





Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FinalProject Automated Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build Server
Write-Host "[1/4] Building Server..." -ForegroundColor Yellow
Push-Location Server
dotnet publish -c Release -o ./publish
if ($LASTEXITCODE -ne 0) {
    throw "Server build failed"
}
Pop-Location
Write-Host "Server build complete." -ForegroundColor Green
Write-Host ""

# Step 2: Build Client
Write-Host "[2/4] Building Client..." -ForegroundColor Yellow
Push-Location ClientSide
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "Client build failed"
}
Pop-Location
Write-Host "Client build complete." -ForegroundColor Green
Write-Host ""

# Step 3: Upload Server
Write-Host "[3/4] Uploading Server to FTP..." -ForegroundColor Yellow
$serverFtpUri = $ftpServer + $serverFtpPath
$baseUriWithCreds = $serverFtpUri -replace 'ftp://', "ftp://$ftpUser`:$ftpPass@"
if (-not $baseUriWithCreds.EndsWith('/')) { $baseUriWithCreds += '/' }

# --- NEW: Take App Offline to unlock files ---
Write-Host "Taking server offline to unlock application files..." -ForegroundColor Cyan
$offlineFile = Join-Path $scriptDir "app_offline.htm"
"<!DOCTYPE html><html><head><title>App Maintenance</title></head><body><h1>Application is updating. Please try again in a few moments.</h1></body></html>" | Out-File -FilePath $offlineFile -Encoding utf8

$webClient = New-Object System.Net.WebClient
try {
    $webClient.UploadFile(($baseUriWithCreds + "app_offline.htm"), "STOR", $offlineFile)
    Write-Host "App is safely offline. Waiting 3 seconds for file locks to release..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
} catch {
    Write-Warning "Failed to place app_offline.htm: $_"
}

# --- Standard Upload ---
Upload-FolderToFtp -LocalFolder $serverOutputPath `
                   -FtpBasePath $serverFtpUri `
                   -FtpUsername $ftpUser `
                   -FtpPassword $ftpPass

# --- NEW: Bring App Back Online by deleting the file ---
Write-Host "Bringing server back online..." -ForegroundColor Cyan
try {
    $dirRequest = [System.Net.FtpWebRequest]::Create($baseUriWithCreds + "app_offline.htm")
    $dirRequest.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $dirRequest.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
    $dirResponse = $dirRequest.GetResponse()
    $dirResponse.Close()
    Write-Host "Server successfully brought back online!" -ForegroundColor Green
} catch {
    Write-Warning "Failed to remove app_offline.htm. You may need to delete it manually via an FTP client."
}

if (Test-Path $offlineFile) { Remove-Item $offlineFile }
$webClient.Dispose()
Write-Host "Server upload complete." -ForegroundColor Green
Write-Host ""

# Step 4: Upload Website
Write-Host "[4/4] Uploading Website to FTP..." -ForegroundColor Yellow
$clientFtpUri = $ftpServer + $clientFtpPath
Upload-FolderToFtp -LocalFolder $clientDistPath `
                   -FtpBasePath $clientFtpUri `
                   -FtpUsername $ftpUser `
                   -FtpPassword $ftpPass
Write-Host "Website upload complete." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Completed Successfully!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan