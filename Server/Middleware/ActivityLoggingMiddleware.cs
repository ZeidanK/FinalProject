using System.Text.Json;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.Middleware;

public class ActivityLoggingMiddleware
{
    private static readonly HashSet<string> MutatingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete
    };

    private readonly RequestDelegate _next;

    public ActivityLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IActivityLogService activityLog)
    {
        await _next(context);

        if (!context.Request.Path.StartsWithSegments("/api"))
            return;

        var statusCode = context.Response.StatusCode;
        var userId = GetUserId(context);
        var ipAddress = GetIpAddress(context);
        var userAgent = context.Request.Headers["User-Agent"].ToString();

        if (ShouldWriteSystemLog(context, statusCode))
        {
            activityLog.LogSystem(new CreateSystemLogRequest
            {
                Level = GetSystemLogLevel(statusCode),
                Category = GetSystemLogCategory(context),
                Message = GetSystemLogMessage(context, statusCode),
                Details = BuildRequestDetails(context, statusCode),
                UserId = userId,
                IpAddress = ipAddress,
                UserAgent = userAgent
            });
        }

        if (!ShouldWriteAuditLog(context, statusCode))
            return;

        activityLog.LogAudit(new CreateAuditLogRequest
        {
            UserId = userId,
            CompanyId = FindLongValue(context, "companyId"),
            Action = $"{context.Request.Method.ToUpperInvariant()} {context.Request.Path}",
            EntityType = GetEntityType(context),
            EntityId = FindLongValue(context, "id") ?? FindLongValue(context, "invoiceId") ?? FindLongValue(context, "accountantId"),
            NewValue = BuildRequestDetails(context, statusCode),
            IpAddress = ipAddress
        });
    }

    private static bool ShouldWriteSystemLog(HttpContext context, int statusCode)
    {
        if (statusCode < StatusCodes.Status400BadRequest)
            return false;

        var path = context.Request.Path;

        if (path.StartsWithSegments("/api/realtime", StringComparison.OrdinalIgnoreCase)
            && statusCode < StatusCodes.Status500InternalServerError)
        {
            return false;
        }

        if (path.StartsWithSegments("/api/Notifications", StringComparison.OrdinalIgnoreCase)
            && statusCode < StatusCodes.Status500InternalServerError)
        {
            return false;
        }

        return true;
    }

    private static bool ShouldWriteAuditLog(HttpContext context, int statusCode)
    {
        if (!MutatingMethods.Contains(context.Request.Method) || statusCode >= StatusCodes.Status400BadRequest)
            return false;

        var path = context.Request.Path;

        if (path.StartsWithSegments("/api/Auth", StringComparison.OrdinalIgnoreCase))
            return false;

        if (path.StartsWithSegments("/api/realtime", StringComparison.OrdinalIgnoreCase))
            return false;

        if (path.StartsWithSegments("/api/Notifications", StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    private static string GetSystemLogLevel(int statusCode)
    {
        return statusCode >= StatusCodes.Status500InternalServerError ? "ERROR" : "WARN";
    }

    private static string GetSystemLogCategory(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        if (path.Contains("/Auth", StringComparison.OrdinalIgnoreCase)
            || path.Contains("/Users", StringComparison.OrdinalIgnoreCase)
            || path.Contains("/Admin", StringComparison.OrdinalIgnoreCase))
        {
            return "security";
        }

        if (path.Contains("/UploadJobs", StringComparison.OrdinalIgnoreCase)
            || path.Contains("/hangfire", StringComparison.OrdinalIgnoreCase))
        {
            return "jobs";
        }

        if (path.Contains("/Matches", StringComparison.OrdinalIgnoreCase)
            || path.Contains("auto-match", StringComparison.OrdinalIgnoreCase))
        {
            return "matching";
        }

        if (path.Contains("/realtime", StringComparison.OrdinalIgnoreCase))
            return "realtime";

        if (path.Contains("upload", StringComparison.OrdinalIgnoreCase)
            || path.Contains("import-excel", StringComparison.OrdinalIgnoreCase)
            || path.Contains("preview-excel", StringComparison.OrdinalIgnoreCase))
        {
            return "upload";
        }

        return "api";
    }

    private static string GetSystemLogMessage(HttpContext context, int statusCode)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        if (statusCode == StatusCodes.Status401Unauthorized)
            return path.Contains("/Auth/login", StringComparison.OrdinalIgnoreCase)
                ? "Login attempt failed"
                : "Unauthorized request was blocked";

        if (statusCode == StatusCodes.Status403Forbidden)
            return "Request was blocked because the user does not have access";

        if (statusCode == StatusCodes.Status404NotFound)
            return "Requested resource was not found";

        if (statusCode >= StatusCodes.Status500InternalServerError)
            return "Server error occurred while handling a request";

        if (path.Contains("upload", StringComparison.OrdinalIgnoreCase))
            return "Upload request failed";

        if (path.Contains("import-excel", StringComparison.OrdinalIgnoreCase)
            || path.Contains("preview-excel", StringComparison.OrdinalIgnoreCase))
        {
            return "Transaction file processing failed";
        }

        if (path.Contains("auto-match", StringComparison.OrdinalIgnoreCase)
            || path.Contains("/Matches", StringComparison.OrdinalIgnoreCase))
        {
            return "Matching request failed";
        }

        return "API request failed";
    }

    private static string BuildRequestDetails(HttpContext context, int statusCode)
    {
        var details = new
        {
            method = context.Request.Method,
            path = context.Request.Path.Value,
            query = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null,
            statusCode,
            traceId = context.TraceIdentifier
        };

        return JsonSerializer.Serialize(details);
    }

    private static string? GetEntityType(HttpContext context)
    {
        var controller = context.Request.RouteValues["controller"]?.ToString();
        return string.IsNullOrWhiteSpace(controller) ? null : controller;
    }

    private static long? GetUserId(HttpContext context)
    {
        var claim = context.User.FindFirst("id")?.Value;
        return long.TryParse(claim, out var id) && id > 0 ? id : null;
    }

    private static string? GetIpAddress(HttpContext context)
    {
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
            return forwardedFor.Split(',')[0].Trim();

        return context.Connection.RemoteIpAddress?.ToString();
    }

    private static long? FindLongValue(HttpContext context, string key)
    {
        if (context.Request.RouteValues.TryGetValue(key, out var routeValue)
            && long.TryParse(routeValue?.ToString(), out var routeId)
            && routeId > 0)
        {
            return routeId;
        }

        if (context.Request.Query.TryGetValue(key, out var queryValue)
            && long.TryParse(queryValue.FirstOrDefault(), out var queryId)
            && queryId > 0)
        {
            return queryId;
        }

        if (context.Request.HasFormContentType
            && context.Request.Form.TryGetValue(key, out var formValue)
            && long.TryParse(formValue.FirstOrDefault(), out var formId)
            && formId > 0)
        {
            return formId;
        }

        return null;
    }
}
