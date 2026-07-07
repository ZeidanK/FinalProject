using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class GetUsersQuery
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 50;
        public string? Role { get; set; }
        public string? Search { get; set; }
    }

    public class GetLogsQuery
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 50;
        public string? Level { get; set; }
        public string? Category { get; set; }
    }

    public class GetAuditLogsQuery
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 50;
        public long? CompanyId { get; set; }
    }

    // ── Admin result rows ─────────────────────────────────────────────────────
    public class AdminStatsRow
    {
        public int TotalUsers        { get; set; }
        public int ActiveUsers       { get; set; }
        public int BannedUsers       { get; set; }
        public int TotalCompanies    { get; set; }
        public int ActiveCompanies   { get; set; }
        public int TotalInvoices     { get; set; }
        public int TotalTransactions { get; set; }
        public int TotalMatches      { get; set; }
        public int OpenAnomalies     { get; set; }
    }

    public class AdminUserRow
    {
        public long      Id            { get; set; }
        public string    Email         { get; set; } = string.Empty;
        public string    Name          { get; set; } = string.Empty;
        public string    Role          { get; set; } = string.Empty;
        public string?   Phone         { get; set; }
        public bool      IsActive      { get; set; }
        public bool      IsBanned      { get; set; }
        public bool      EmailVerified { get; set; }
        public DateTime? LastLoginAt   { get; set; }
        public DateTime  CreatedAt     { get; set; }
    }

    public class PagedResult<T>
    {
        public int        TotalCount { get; set; }
        public List<T>    Items      { get; set; } = new();
    }

    public class SystemLogRow
    {
        public long      Id         { get; set; }
        public string    Level      { get; set; } = string.Empty;
        public string?   Category   { get; set; }
        public string    Message    { get; set; } = string.Empty;
        public string?   Details    { get; set; }
        public long?     UserId     { get; set; }
        public string?   IpAddress  { get; set; }
        public string?   UserAgent  { get; set; }
        public DateTime  CreatedAt  { get; set; }
    }

    public class AuditLogRow
    {
        public long      Id          { get; set; }
        public long?     UserId      { get; set; }
        public string?   UserName    { get; set; }
        public long?     CompanyId   { get; set; }
        public string    Action      { get; set; } = string.Empty;
        public string?   EntityType  { get; set; }
        public long?     EntityId    { get; set; }
        public string?   OldValue    { get; set; }
        public string?   NewValue    { get; set; }
        public string?   IpAddress   { get; set; }
        public DateTime  CreatedAt   { get; set; }
    }
}
