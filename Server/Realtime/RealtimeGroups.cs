namespace FinalProjectAuthAPI.Realtime
{
    public static class RealtimeGroups
    {
        public const string Admins = "admins";

        public static string User(long userId) => $"user_{userId}";

        public static string Company(long companyId) => $"company_{companyId}";

        public static string CompanyOwners(long companyId) => $"company_{companyId}_owners";

        public static string CompanyAccountants(long companyId) => $"company_{companyId}_accountants";
    }
}