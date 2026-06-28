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

    # Format base URI cleanly
    $baseUri = $FtpBasePath
    if (-not $baseUri.EndsWith('/')) { $baseUri += '/' }
    $baseUriWithCreds = $baseUri -replace 'ftp://', "ftp://$FtpUsername`:$FtpPassword@"

    # Use a persistent WebClient session to avoid constant reconnecting
    $webClient = New-Object System.Net.WebClient
    
    # Track directories we've already created during this run to avoid duplicate server requests
    $createdDirs = @()

    foreach ($file in $files) {
        $current++
        
        $relativePath = $file.FullName.Substring($resolvedLocalFolder.Length).TrimStart('\')
        $escapedPath = $relativePath -replace '\\', '/'
        $targetFtpUrl = "$baseUriWithCreds$escapedPath"

        # Check if the file lives inside a subfolder (e.g., "assets/index.css")
        if ($escapedPath.Contains('/')) {
            # Extract the folder path portion (e.g., "assets")
            $remoteSubFolder = Split-Path -Path $escapedPath -Parent
            
            # If we haven't processed this folder yet, make sure it exists on the FTP server
            if ($remoteSubFolder -notin $createdDirs) {
                try {
                    $dirUrl = "$baseUriWithCreds$remoteSubFolder"
                    
                    # Create the remote directory using FTP Make Directory command (MKD)
                    $dirRequest = [System.Net.FtpWebRequest]::Create($dirUrl)
                    $dirRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUsername, $FtpPassword)
                    $dirRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                    
                    $dirResponse = $dirRequest.GetResponse()
                    $dirResponse.Close()
                    
                    $createdDirs += $remoteSubFolder
                }
                catch {
                    # If the folder already exists, WebException triggers a 550 error, which we can safely ignore
                    if ($_.Exception.InnerException -and $_.Exception.InnerException.Message -like "*550*") {
                        $createdDirs += $remoteSubFolder
                    } else {
                        Write-Warning "Failed to verify or create directory '$remoteSubFolder': $_"
                    }
                }
            }
        }

        # Safe upload through the persistent WebClient pipe
        try {
            $webClient.UploadFile($targetFtpUrl, "STOR", $file.FullName)
            Write-Host "Uploaded ($current/$total): $relativePath"
        }
        catch {
            Write-Warning "Upload failed for $relativePath - $_"
        }
    }
    
    $webClient.Dispose()
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
Upload-FolderToFtp -LocalFolder $serverOutputPath `
                   -FtpBasePath $serverFtpUri `
                   -FtpUsername $ftpUser `
                   -FtpPassword $ftpPass
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