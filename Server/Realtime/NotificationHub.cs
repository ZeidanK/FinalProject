using FinalProjectAuthAPI.DAL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FinalProjectAuthAPI.Realtime
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly IDBservices _db;
        private readonly RealtimeConnectionRegistry _registry;
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(
            IDBservices db,
            RealtimeConnectionRegistry registry,
            ILogger<NotificationHub> logger)
        {
            _db = db;
            _registry = registry;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            if (userId <= 0 || !_db.IsUserActive(userId))
            {
                _logger.LogWarning(
                    "Rejected realtime connection {ConnectionId}: invalid or inactive user",
                    Context.ConnectionId);
                Context.Abort();
                return;
            }

            _registry.Register(Context.ConnectionId, userId);
            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.User(userId));

            var role = GetCurrentUserRole();
            if (IsAdmin(role))
                await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.Admins);

            _logger.LogDebug(
                "Realtime connection {ConnectionId} joined user group for user {UserId}",
                Context.ConnectionId, userId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetCurrentUserId();
            _registry.Unregister(Context.ConnectionId);
            _logger.LogDebug(
                exception,
                "Realtime connection {ConnectionId} disconnected for user {UserId}",
                Context.ConnectionId, userId);
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinCompany(long companyId)
        {
            var userId = GetCurrentUserId();
            if (userId <= 0 || companyId <= 0)
                throw new HubException("Invalid user or company.");

            if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                throw new HubException("Access denied for this company.");

            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.Company(companyId));
            _registry.JoinCompany(Context.ConnectionId, companyId);

            var role = GetCurrentUserRole();
            var isCreator = _db.IsCompanyCreator(userId, companyId);
            if (isCreator)
                await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.CompanyOwners(companyId));

            if (!isCreator && IsAccountantRole(role))
                await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.CompanyAccountants(companyId));

            _logger.LogDebug(
                "Realtime connection {ConnectionId} joined company {CompanyId} for user {UserId}",
                Context.ConnectionId, companyId, userId);
        }

        public async Task LeaveCompany(long companyId)
        {
            if (companyId <= 0)
                return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroups.Company(companyId));
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroups.CompanyOwners(companyId));
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroups.CompanyAccountants(companyId));
            _registry.LeaveCompany(Context.ConnectionId, companyId);
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

        private static bool IsAccountantRole(string? role)
        {
            return string.Equals(role, "accountant", StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, "accountant_business_owner", StringComparison.OrdinalIgnoreCase);
        }
    }
}
