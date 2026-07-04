using FinalProjectAuthAPI.Middleware;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Middleware
{
    public class SecurityHeadersMiddlewareTests
    {
        [Fact]
        public async Task InvokeAsync_SetsSecurityHeaders()
        {
            var context = new DefaultHttpContext();
            context.Request.Scheme = "https";
            context.Request.Host = new HostString("localhost");
            context.Request.Path = "/api/test";
            context.Response.Body = new System.IO.MemoryStream();

            var wasCalled = false;
            RequestDelegate next = _ =>
            {
                wasCalled = true;
                return Task.CompletedTask;
            };

            var middleware = new SecurityHeadersMiddleware(next);
            await middleware.InvokeAsync(context);

            Assert.True(wasCalled);
            Assert.Equal("nosniff", context.Response.Headers["X-Content-Type-Options"]);
            Assert.Equal("DENY", context.Response.Headers["X-Frame-Options"]);
            Assert.Equal("strict-origin-when-cross-origin", context.Response.Headers["Referrer-Policy"]);
            Assert.Equal("0", context.Response.Headers["X-XSS-Protection"]);
            Assert.Contains("camera", context.Response.Headers["Permissions-Policy"].ToString());
        }

        [Fact]
        public async Task InvokeAsync_HttpsRequest_SetsHsts()
        {
            var context = new DefaultHttpContext();
            context.Request.Scheme = "https";
            context.Request.Host = new HostString("localhost");
            context.Request.Path = "/api/test";
            context.Response.Body = new System.IO.MemoryStream();

            RequestDelegate next = _ => Task.CompletedTask;
            var middleware = new SecurityHeadersMiddleware(next);
            await middleware.InvokeAsync(context);

            var hsts = context.Response.Headers["Strict-Transport-Security"].ToString();
            Assert.Contains("max-age=31536000", hsts);
            Assert.Contains("includeSubDomains", hsts);
        }

        [Fact]
        public async Task InvokeAsync_HttpRequest_NoHsts()
        {
            var context = new DefaultHttpContext();
            context.Request.Scheme = "http";
            context.Request.Host = new HostString("localhost");
            context.Request.Path = "/api/test";
            context.Response.Body = new System.IO.MemoryStream();

            RequestDelegate next = _ => Task.CompletedTask;
            var middleware = new SecurityHeadersMiddleware(next);
            await middleware.InvokeAsync(context);

            Assert.True(string.IsNullOrEmpty(context.Response.Headers["Strict-Transport-Security"]));
        }
    }
}