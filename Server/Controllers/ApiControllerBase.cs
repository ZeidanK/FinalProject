using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected long GetCurrentUserId()
    {
        var claim = User.FindFirst("id")?.Value;
        return long.TryParse(claim, out var id) ? id : 0;
    }

    protected string? GetCurrentUserRole()
    {
        return User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
               ?? User.FindFirst("role")?.Value;
    }
}