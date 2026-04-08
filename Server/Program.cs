using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── Dependency Injection: register BL services ───────────────────────────
builder.Services.AddScoped<DBservices>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IAnomalyService, AnomalyService>();
builder.Services.AddScoped<IBankAccountService, BankAccountService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IInvoiceUploadService, InvoiceUploadService>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPdfExtractionService, PdfExtractionService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IExcelExtractionService, ExcelExtractionService>();

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
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
