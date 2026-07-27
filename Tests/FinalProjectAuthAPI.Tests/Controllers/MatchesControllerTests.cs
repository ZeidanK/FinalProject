using System.Security.Claims;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class MatchesControllerTests
    {
        private readonly Mock<IMatchService> _mockSvc;
        private readonly MatchesController _controller;

        public MatchesControllerTests()
        {
            _mockSvc = new Mock<IMatchService>();
            _controller = new MatchesController(_mockSvc.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "1"),
                        new Claim(ClaimTypes.Role, "business_owner")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetByCompany_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetByCompany(5)).Returns(new List<MatchRow>());

            var result = _controller.GetByCompany(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new MatchRow { Id = 1 });

            var result = _controller.GetById(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((MatchRow?)null);

            var result = _controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetSuggestions_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetSuggestionsAsync(5)).ReturnsAsync(new List<MatchSuggestionRow>());

            var result = await _controller.GetSuggestions(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetSimpleSuggestions_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetSimpleSuggestions(5)).Returns(new List<SimpleMatchSuggestion>());

            var result = _controller.GetSimpleSuggestions(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetInstallmentSuggestions_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetInstallmentSuggestions(5)).Returns(new List<InstallmentGroupSuggestion>());

            var result = _controller.GetInstallmentSuggestions(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Create_Valid_Returns201()
        {
            _mockSvc.Setup(x => x.Create(It.IsAny<CreateMatchRequest>(), 1))
                .Returns((true, 10L, ""));

            var result = _controller.Create(new CreateMatchRequest());

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(10L, created.RouteValues!["id"]);
        }

        [Fact]
        public void Create_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.Create(It.IsAny<CreateMatchRequest>(), 1))
                .Returns((false, 0L, "error"));

            var result = _controller.Create(new CreateMatchRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task AutoMatch_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.AutoMatchAsync(1, 1, 70m))
                .ReturnsAsync((true, 5L, "matched", 95m));

            var result = await _controller.AutoMatch(1, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task AutoMatch_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.AutoMatchAsync(1, 1, 70m))
                .ReturnsAsync((false, (long?)null, "no match", (decimal?)null));

            var result = await _controller.AutoMatch(1, null);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void Delete_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.Delete(1)).Returns(true);

            var result = _controller.Delete(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Delete_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.Delete(99)).Returns(false);

            var result = _controller.Delete(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
