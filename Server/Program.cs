using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Hangfire;
using Hangfire.SqlServer;
using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Middleware;
using FinalProjectAuthAPI.Models;
using FinalProjectAuthAPI.Realtime;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── Dependency Injection: register BL services ───────────────────────────
builder.Services.AddScoped<DBservices>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IAnomalyService, AnomalyService>();
builder.Services.AddScoped<IBankAccountService, BankAccountService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IInvoiceUploadService, InvoiceUploadService>();
builder.Services.AddScoped<IInvoiceVerificationService, InvoiceVerificationService>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<FinalProjectAuthAPI.MatchingEngine.RulePipelineEngine>();
builder.Services.AddScoped<FinalProjectAuthAPI.MatchingEngine.IFxRateProvider, FinalProjectAuthAPI.MatchingEngine.MockFxRateProvider>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAccountantService, AccountantService>();
builder.Services.AddScoped<IPdfExtractionService, PdfExtractionService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IExcelExtractionService, ExcelExtractionService>();
builder.Services.AddScoped<IUploadJobService, UploadJobService>();
builder.Services.AddScoped<IUploadJobWorker, UploadJobWorker>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IRealtimeNotificationService, RealtimeNotificationService>();
builder.Services.AddSingleton<RealtimeConnectionRegistry>();
// Internal services (domain sub-classes)
builder.Services.AddScoped<FinalProjectAuthAPI.BL.Matching.MatchCrudService>();
builder.Services.AddScoped<FinalProjectAuthAPI.BL.Matching.MatchSuggestionService>();
builder.Services.AddScoped<FinalProjectAuthAPI.BL.Matching.AutoMatchService>();
builder.Services.AddScoped<FinalProjectAuthAPI.BL.AnomalyDetection.AnomalyCrudService>();
builder.Services.AddScoped<FinalProjectAuthAPI.BL.AnomalyDetection.DuplicateInvoiceService>();
builder.Services.AddScoped<FinalProjectAuthAPI.BL.AnomalyDetection.DuplicateFileDetectionService>();
builder.Services.AddScoped<FinalProjectAuthAPI.BL.UploadProcessing.UploadJobNotificationService>();
builder.Services.AddScoped<FinalProjectAuthAPI.BL.UploadProcessing.InvoiceJobProcessor>();
builder.Services.AddScoped<FinalProjectAuthAPI.BL.UploadProcessing.TransactionJobProcessor>();
builder.Services.AddSignalR();

var hangfireConnectionString = builder.Configuration.GetConnectionString("myProjDB");
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(hangfireConnectionString, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.FromSeconds(15),
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    }));
builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = Math.Max(1, Environment.ProcessorCount / 2);
    options.Queues = new[] { "uploads", "default" };
});

// AI provider toggle: set "AiProvider" in appsettings.json to "gemini" or "ollama"
var aiProvider = builder.Configuration["AiProvider"] ?? "gemini";

if (aiProvider.Equals("ollama", StringComparison.OrdinalIgnoreCase))
{
    var ollamaSettings = new OllamaSettings();
    builder.Configuration.GetSection("OllamaSettings").Bind(ollamaSettings);
    builder.Services.AddSingleton(ollamaSettings);
    builder.Services.AddHttpClient("ollama", client =>
    {
        client.Timeout = TimeSpan.FromMinutes(10);
    });
    builder.Services.AddScoped<IGeminiExtractionService, OllamaExtractionService>();
}
else
{
    var geminiSettings = new GeminiSettings();
    builder.Configuration.GetSection("GeminiSettings").Bind(geminiSettings);
    builder.Services.AddSingleton(geminiSettings);
    builder.Services.AddSingleton<GeminiApiKeyPool>();
    builder.Services.AddScoped<IGeminiExtractionService, GeminiExtractionService>();
}

  // CORS – allow the React frontend (and any localhost port during dev)
  builder.Services.AddCors(options =>
  {
      options.AddPolicy("AllowFrontend", policy =>
      {
          policy.WithOrigins(
                  "http://localhost:5173",
                  "https://localhost:5173",
                  "http://localhost:3000"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
      });
  });

  // Allow any origin for SignalR during development to avoid negotiate negotiation failures
  builder.Services.AddCors(options =>
  {
      options.AddPolicy("SignalRDev", policy =>
      {
          policy.SetIsOriginAllowed(origin => true)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
      });
  });


// JWT Authentication – mirrors the NewsSitePro setup
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = jwtSettings["Key"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings["Issuer"],
        ValidAudience            = jwtSettings["Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        ClockSkew                = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var path = context.HttpContext.Request.Path;
            var fullPath = $"{context.HttpContext.Request.PathBase}{path}";
            var isSignalRRequest = path.StartsWithSegments("/api/realtime/notifications")
                || fullPath.Contains("/api/realtime/notifications", StringComparison.OrdinalIgnoreCase);

            if (!isSignalRRequest)
                return Task.CompletedTask;

            // Prefer Authorization header (SignalR accessTokenFactory sends Bearer token there),
            // fall back to the legacy access_token query parameter for older clients.
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                context.Token = authHeader.Substring("Bearer ".Length).Trim();
                return Task.CompletedTask;
            }

            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrWhiteSpace(accessToken))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

  app.UseCors("AllowFrontend");
  app.UseCors("SignalRDev");
app.UseStaticFiles();
app.UseAuthentication();
app.UseMiddleware<ActivityLoggingMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapHangfireDashboard("/hangfire");
  app.MapHub<NotificationHub>("/api/realtime/notifications")
     .RequireCors("SignalRDev");

RecurringJob.AddOrUpdate<INotificationService>(
    "notification-retention",
    service => service.CleanupExpired(90, 365),
    Cron.Daily);

  app.Run();
