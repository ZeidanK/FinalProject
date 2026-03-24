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
}
