using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Middleware;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Middleware
{
    public class ActivityLoggingMiddlewareTests
    {
        [Fact]
        public async Task InvokeAsync_NonApiPath_SkipsLogging()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/health";
            context.Request.Method = "GET";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 200;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogSystem(It.IsAny<CreateSystemLogRequest>()), Times.Never);
            activityLog.Verify(x => x.LogAudit(It.IsAny<CreateAuditLogRequest>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_SuccessfulGet_NoAuditLog()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/invoices";
            context.Request.Method = "GET";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 200;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogAudit(It.IsAny<CreateAuditLogRequest>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_SuccessfulPost_LogsAudit()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/invoices";
            context.Request.Method = "POST";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 200;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogAudit(It.Is<CreateAuditLogRequest>(
                r => r.Action.Contains("POST"))), Times.Once);
        }

        [Fact]
        public async Task InvokeAsync_ErrorStatus_LogsSystemWarning()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/invoices";
            context.Request.Method = "GET";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 404;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                r => r.Level == "WARN")), Times.Once);
        }

        [Fact]
        public async Task InvokeAsync_ServerError_LogsError()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/invoices";
            context.Request.Method = "GET";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 500;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                r => r.Level == "ERROR")), Times.Once);
        }

        [Fact]
        public async Task InvokeAsync_AuthPath_NoAuditLog()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/Auth/login";
            context.Request.Method = "POST";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 200;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogAudit(It.IsAny<CreateAuditLogRequest>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_RealtimePath_NoSystemLogForClientErrors()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/realtime/negotiate";
            context.Request.Method = "POST";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 400;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogSystem(It.IsAny<CreateSystemLogRequest>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_RealtimePath_LogsSystemErrorFor500()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/realtime/negotiate";
            context.Request.Method = "POST";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 500;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                r => r.Level == "ERROR")), Times.Once);
        }

        [Fact]
        public async Task InvokeAsync_UploadPath_CategorizesAsUpload()
        {
            var activityLog = new Mock<IActivityLogService>();
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/upload-jobs/1/upload";
            context.Request.Method = "POST";
            context.Response.Body = new System.IO.MemoryStream();
            context.Response.StatusCode = 400;

            RequestDelegate next = ctx => Task.CompletedTask;
            var middleware = new ActivityLoggingMiddleware(next);
            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                r => r.Category == "upload")), Times.Once);
        }
    }
}