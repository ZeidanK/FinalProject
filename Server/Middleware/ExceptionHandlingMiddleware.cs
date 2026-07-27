using System.Text.Json;

namespace FinalProjectAuthAPI.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, FinalProjectAuthAPI.BL.Interfaces.IActivityLogService activityLog)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var traceId = context.TraceIdentifier;
            _logger.LogError(ex, "Unhandled exception. TraceId: {TraceId}", traceId);
            activityLog.LogSystem(new FinalProjectAuthAPI.Models.CreateSystemLogRequest
            {
                Level = "ERROR",
                Category = "exception",
                Message = $"Unhandled exception on {context.Request.Method} {context.Request.Path}",
                Details = $"{ex.GetType().Name}: {ex.Message}\nTraceId: {traceId}",
                UserId = GetUserId(context),
                IpAddress = GetIpAddress(context),
                UserAgent = context.Request.Headers["User-Agent"].ToString()
            });

            try
            {
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";

                var payload = new
                {
                    code = "INTERNAL_SERVER_ERROR",
                    message = "An unexpected error occurred.",
                    traceId,
                    timestamp = DateTimeOffset.UtcNow
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
            }
            catch (Exception innerEx)
            {
                _logger.LogWarning(innerEx, "Failed to write error response for TraceId: {TraceId}. Response may have already started.", traceId);
            }
        }
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
}
