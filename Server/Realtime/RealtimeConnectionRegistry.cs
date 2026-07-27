using System.Collections.Concurrent;

namespace FinalProjectAuthAPI.Realtime
{
    public sealed class RealtimeConnectionRegistry
    {
        private sealed class Registration
        {
            public long UserId { get; init; }
            public ConcurrentDictionary<long, byte> CompanyIds { get; } = new();
        }

        private readonly ConcurrentDictionary<string, Registration> _connections = new();

        public void Register(string connectionId, long userId) =>
            _connections[connectionId] = new Registration { UserId = userId };

        public void Unregister(string connectionId) =>
            _connections.TryRemove(connectionId, out _);

        public void JoinCompany(string connectionId, long companyId)
        {
            if (_connections.TryGetValue(connectionId, out var registration))
                registration.CompanyIds[companyId] = 0;
        }

        public void LeaveCompany(string connectionId, long companyId)
        {
            if (_connections.TryGetValue(connectionId, out var registration))
                registration.CompanyIds.TryRemove(companyId, out _);
        }

        public IReadOnlyList<string> GetUserConnections(long userId) =>
            _connections
                .Where(pair => pair.Value.UserId == userId)
                .Select(pair => pair.Key)
                .ToList();

        public IReadOnlyList<long> GetConnectionCompanies(string connectionId) =>
            _connections.TryGetValue(connectionId, out var registration)
                ? registration.CompanyIds.Keys.ToList()
                : Array.Empty<long>();
    }
}
