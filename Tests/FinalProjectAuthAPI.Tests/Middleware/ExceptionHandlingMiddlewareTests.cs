using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Middleware;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Middleware
{
    public class ExceptionHandlingMiddlewareTests
    {
        [Fact]
        public async Task InvokeAsync_NoException_CallsNext()
        {
            var wasCalled = false;
            RequestDelegate next = ctx =>
            {
                wasCalled = true;
                return Task.CompletedTask;
            };
            var logger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
            var middleware = new ExceptionHandlingMiddleware(next, logger.Object);
            var context = new DefaultHttpContext();
            context.Response.Body = new System.IO.MemoryStream();
            var activityLog = new Mock<IActivityLogService>();

            await middleware.InvokeAsync(context, activityLog.Object);

            Assert.True(wasCalled);
        }

        [Fact]
        public async Task InvokeAsync_ExceptionCaught_Returns500()
        {
            RequestDelegate next = ctx => throw new InvalidOperationException("Test error");
            var logger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
            var middleware = new ExceptionHandlingMiddleware(next, logger.Object);
            var context = new DefaultHttpContext();
            context.Response.Body = new System.IO.MemoryStream();
            context.TraceIdentifier = "test-trace";
            context.Request.Method = "GET";
            context.Request.Path = "/api/test";
            var activityLog = new Mock<IActivityLogService>();

            await middleware.InvokeAsync(context, activityLog.Object);

            Assert.Equal(500, context.Response.StatusCode);
            context.Response.Body.Seek(0, System.IO.SeekOrigin.Begin);
            var body = new System.IO.StreamReader(context.Response.Body).ReadToEnd();
            Assert.Contains("INTERNAL_SERVER_ERROR", body);
            Assert.Contains("test-trace", body);
        }

        [Fact]
        public async Task InvokeAsync_ExceptionCaught_LogsError()
        {
            RequestDelegate next = ctx => throw new InvalidOperationException("Test error");
            var logger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
            var middleware = new ExceptionHandlingMiddleware(next, logger.Object);
            var context = new DefaultHttpContext();
            context.Response.Body = new System.IO.MemoryStream();
            context.TraceIdentifier = "test-trace";
            context.Request.Method = "GET";
            context.Request.Path = "/api/test";
            var activityLog = new Mock<IActivityLogService>();

            await middleware.InvokeAsync(context, activityLog.Object);

            activityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                r => r.Level == "ERROR" && r.Category == "exception")), Times.Once);
        }

        [Fact]
        public async Task InvokeAsync_ResponseAlreadyStarted_Throws()
        {
            RequestDelegate next = async ctx =>
            {
                ctx.Response.StatusCode = 200;
                await ctx.Response.WriteAsync("partial");
                throw new InvalidOperationException("Late error");
            };
            var logger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
            var middleware = new ExceptionHandlingMiddleware(next, logger.Object);
            var context = new DefaultHttpContext();
            context.Response.Body = new System.IO.MemoryStream();
            var activityLog = new Mock<IActivityLogService>();

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                middleware.InvokeAsync(context, activityLog.Object));
        }
    }
}