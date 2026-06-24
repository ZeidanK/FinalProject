using FinalProjectAuthAPI.DAL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FinalProjectAuthAPI.Realtime
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly DBservices _db;

        public NotificationHub(DBservices db)
        {
            _db = db;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            if (userId <= 0)
            {
                Context.Abort();
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.User(userId));

            var role = GetCurrentUserRole();
            if (IsAdmin(role))
                await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.Admins);

            await base.OnConnectedAsync();
        }

        public async Task JoinCompany(long companyId)
        {
            var userId = GetCurrentUserId();
            if (userId <= 0 || companyId <= 0)
                throw new HubException("Invalid user or company.");

            if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                throw new HubException("Access denied for this company.");

            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.Company(companyId));

            var role = GetCurrentUserRole();
            if (IsOwnerRole(role))
                await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.CompanyOwners(companyId));

            if (IsAccountantRole(role))
                await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.CompanyAccountants(companyId));
        }

        public async Task LeaveCompany(long companyId)
        {
            if (companyId <= 0)
                return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroups.Company(companyId));
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroups.CompanyOwners(companyId));
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroups.CompanyAccountants(companyId));
        }

        private long GetCurrentUserId()
        {
            var claim = Context.User?.FindFirst("id")?.Value;
            return long.TryParse(claim, out var id) ? id : 0;
        }

        private string? GetCurrentUserRole()
        {
            return Context.User?.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                   ?? Context.User?.FindFirst("role")?.Value;
        }

        private static bool IsAdmin(string? role)
        {
            return string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsOwnerRole(string? role)
        {
            return string.Equals(role, "business_owner", StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, "accountant_business_owner", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsAccountantRole(string? role)
        {
            return string.Equals(role, "accountant", StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, "accountant_business_owner", StringComparison.OrdinalIgnoreCase);
        }
    }
}