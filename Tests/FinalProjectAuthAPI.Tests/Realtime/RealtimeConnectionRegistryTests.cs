using FinalProjectAuthAPI.Realtime;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Realtime
{
    public class RealtimeConnectionRegistryTests
    {
        private readonly RealtimeConnectionRegistry _registry = new();

        [Fact]
        public void Register_NewConnection_AddsToRegistry()
        {
            _registry.Register("conn1", 10);
            var connections = _registry.GetUserConnections(10);
            Assert.Contains("conn1", connections);
        }

        [Fact]
        public void Register_ExistingConnection_UpdatesUserId()
        {
            _registry.Register("conn1", 10);
            _registry.Register("conn1", 20);
            var connections = _registry.GetUserConnections(10);
            Assert.DoesNotContain("conn1", connections);
            Assert.Contains("conn1", _registry.GetUserConnections(20));
        }

        [Fact]
        public void Unregister_RemovesEntry()
        {
            _registry.Register("conn1", 10);
            _registry.Unregister("conn1");
            Assert.Empty(_registry.GetUserConnections(10));
        }

        [Fact]
        public void Unregister_UnknownConnection_DoesNotThrow()
        {
            _registry.Unregister("nonexistent");
        }

        [Fact]
        public void GetUserConnections_NoRegistrations_ReturnsEmpty()
        {
            Assert.Empty(_registry.GetUserConnections(99));
        }

        [Fact]
        public void GetUserConnections_MultipleConnections_ReturnsAll()
        {
            _registry.Register("conn1", 10);
            _registry.Register("conn2", 10);
            _registry.Register("conn3", 20);

            var connections = _registry.GetUserConnections(10);
            Assert.Equal(2, connections.Count);
            Assert.Contains("conn1", connections);
            Assert.Contains("conn2", connections);
        }

        [Fact]
        public void JoinCompany_AddsCompanyToConnection()
        {
            _registry.Register("conn1", 10);
            _registry.JoinCompany("conn1", 5);
            var companies = _registry.GetConnectionCompanies("conn1");
            Assert.Contains(5L, companies);
        }

        [Fact]
        public void JoinCompany_UnknownConnection_DoesNothing()
        {
            _registry.JoinCompany("nonexistent", 5);
            Assert.Empty(_registry.GetConnectionCompanies("nonexistent"));
        }

        [Fact]
        public void LeaveCompany_RemovesCompany()
        {
            _registry.Register("conn1", 10);
            _registry.JoinCompany("conn1", 5);
            _registry.JoinCompany("conn1", 7);
            _registry.LeaveCompany("conn1", 5);

            var companies = _registry.GetConnectionCompanies("conn1");
            Assert.DoesNotContain(5L, companies);
            Assert.Contains(7L, companies);
        }

        [Fact]
        public void LeaveCompany_UnknownConnection_DoesNothing()
        {
            _registry.LeaveCompany("nonexistent", 5);
        }

        [Fact]
        public void GetConnectionCompanies_UnknownConnection_ReturnsEmpty()
        {
            Assert.Empty(_registry.GetConnectionCompanies("nonexistent"));
        }

        [Fact]
        public void JoinCompany_MultipleTimes_Deduplicates()
        {
            _registry.Register("conn1", 10);
            _registry.JoinCompany("conn1", 5);
            _registry.JoinCompany("conn1", 5);
            var companies = _registry.GetConnectionCompanies("conn1");
            Assert.Single(companies);
        }
    }
}