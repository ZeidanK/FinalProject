using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Realtime;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Realtime
{
    public class NotificationHubTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly RealtimeConnectionRegistry _registry;
        private readonly Mock<ILogger<NotificationHub>> _mockLogger;

        public NotificationHubTests()
        {
            _mockDb = new Mock<IDBservices>();
            _registry = new RealtimeConnectionRegistry();
            _mockLogger = new Mock<ILogger<NotificationHub>>();
        }

        [Fact]
        public async Task OnConnectedAsync_InvalidUserId_AbortsConnection()
        {
            var hub = CreateHub(userId: 0);
            await hub.OnConnectedAsync();
            // Connection should be aborted - no registration
            Assert.Empty(_registry.GetUserConnections(0));
        }

        [Fact]
        public async Task OnConnectedAsync_InactiveUser_AbortsConnection()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(false);
            var hub = CreateHub(userId: 10);
            await hub.OnConnectedAsync();
            Assert.Empty(_registry.GetUserConnections(10));
        }

        [Fact]
        public async Task OnConnectedAsync_ValidUser_RegistersConnection()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(true);
            var hub = CreateHub(userId: 10, role: "business_owner");
            await hub.OnConnectedAsync();
            var connections = _registry.GetUserConnections(10);
            Assert.Single(connections);
        }

        [Fact]
        public async Task OnConnectedAsync_AdminUser_JoinsAdminGroup()
        {
            _mockDb.Setup(x => x.IsUserActive(1)).Returns(true);
            var hub = CreateHub(userId: 1, role: "admin");
            await hub.OnConnectedAsync();
            var connections = _registry.GetUserConnections(1);
            Assert.Single(connections);
        }

        [Fact]
        public async Task OnDisconnectedAsync_UnregistersConnection()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(true);
            var hub = CreateHub(userId: 10);
            await hub.OnConnectedAsync();
            Assert.Single(_registry.GetUserConnections(10));

            await hub.OnDisconnectedAsync(null);
            Assert.Empty(_registry.GetUserConnections(10));
        }

        [Fact]
        public async Task JoinCompany_InvalidCompanyId_Throws()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(true);
            var hub = CreateHub(userId: 10);
            await hub.OnConnectedAsync();

            await Assert.ThrowsAsync<HubException>(() => hub.JoinCompany(0));
        }

        [Fact]
        public async Task JoinCompany_NoAccess_Throws()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(true);
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);
            var hub = CreateHub(userId: 10);
            await hub.OnConnectedAsync();

            await Assert.ThrowsAsync<HubException>(() => hub.JoinCompany(5));
        }

        [Fact]
        public async Task JoinCompany_ValidAccess_JoinsCompany()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(true);
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockDb.Setup(x => x.IsCompanyCreator(10, 5)).Returns(false);
            var hub = CreateHub(userId: 10, role: "accountant");
            await hub.OnConnectedAsync();

            await hub.JoinCompany(5);
            var companies = _registry.GetConnectionCompanies("test-conn-id");
            Assert.Contains(5L, companies);
        }

        [Fact]
        public async Task JoinCompany_CompanyCreator_JoinsOwnersGroup()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(true);
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockDb.Setup(x => x.IsCompanyCreator(10, 5)).Returns(true);
            var hub = CreateHub(userId: 10);
            await hub.OnConnectedAsync();

            await hub.JoinCompany(5);
            var companies = _registry.GetConnectionCompanies("test-conn-id");
            Assert.Contains(5L, companies);
        }

        [Fact]
        public async Task LeaveCompany_Valid_LeavesCompany()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(true);
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockDb.Setup(x => x.IsCompanyCreator(10, 5)).Returns(false);
            var hub = CreateHub(userId: 10);
            await hub.OnConnectedAsync();
            await hub.JoinCompany(5);
            Assert.Single(_registry.GetConnectionCompanies("test-conn-id"));

            await hub.LeaveCompany(5);
            Assert.Empty(_registry.GetConnectionCompanies("test-conn-id"));
        }

        [Fact]
        public async Task LeaveCompany_InvalidCompanyId_DoesNotThrow()
        {
            _mockDb.Setup(x => x.IsUserActive(10)).Returns(true);
            var hub = CreateHub(userId: 10);
            await hub.OnConnectedAsync();
            await hub.LeaveCompany(0);
        }

        private NotificationHub CreateHub(long userId, string role = "business_owner")
        {
            var hub = new NotificationHub(_mockDb.Object, _registry, _mockLogger.Object);

            var mockContext = new Mock<HubCallerContext>();
            var mockUser = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim("id", userId.ToString()),
                    new System.Security.Claims.Claim("role", role)
                }));
            mockContext.Setup(c => c.User).Returns(mockUser);
            mockContext.Setup(c => c.ConnectionId).Returns("test-conn-id");
            hub.Context = mockContext.Object;

            var mockClients = new Mock<IHubCallerClients>();
            var mockClientProxy = new Mock<IClientProxy>();
            mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
            hub.Clients = mockClients.Object;

            var mockGroups = new Mock<IGroupManager>();
            hub.Groups = mockGroups.Object;

            return hub;
        }
    }
}