using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        public void InsertSystemLog(CreateSystemLogRequest log)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_SystemLogs_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@Level", log.Level },
                        { "@Category", log.Category },
                        { "@Message", log.Message },
                        { "@Details", log.Details },
                        { "@UserId", log.UserId },
                        { "@IpAddress", log.IpAddress },
                        { "@UserAgent", log.UserAgent }
                    });

                cmd.ExecuteNonQuery();
            }
            finally
            {
                con?.Close();
            }
        }

        public void InsertAuditLog(CreateAuditLogRequest log)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_AuditLogs_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", log.UserId },
                        { "@CompanyId", log.CompanyId },
                        { "@Action", log.Action },
                        { "@EntityType", log.EntityType },
                        { "@EntityId", log.EntityId },
                        { "@OldValue", log.OldValue },
                        { "@NewValue", log.NewValue },
                        { "@IpAddress", log.IpAddress }
                    });

                cmd.ExecuteNonQuery();
            }
            finally
            {
                con?.Close();
            }
        }
    }
}
