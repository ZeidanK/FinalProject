using FinalProjectAuthAPI.DAL;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;

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

    protected bool CanAccessCompany(long companyId, IDBservices db)
    {
        return db.UserHasActiveCompanyAccess(GetCurrentUserId(), companyId);
    }

    protected IActionResult Success<T>(T data, string message = "Success", int code = 200)
    {
        return Ok(new
        {
            success = true,
            code,
            message,
            data
        });
    }

    protected IActionResult SuccessWithLegacy<T>(
        T data,
        object? legacyFields,
        string message = "Success",
        int code = 200)
    {
        var result = new Dictionary<string, object?>
        {
            ["success"] = true,
            ["code"] = code,
            ["message"] = message,
            ["data"] = data
        };

        if (legacyFields is not null)
        {
            foreach (var property in legacyFields.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public))
            {
                result[property.Name] = property.GetValue(legacyFields);
            }
        }

        return Ok(result);
    }
}