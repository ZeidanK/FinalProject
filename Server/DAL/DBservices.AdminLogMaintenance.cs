using System.Data.SqlClient;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        public int ClearSystemLogs()
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_ClearSystemLogs", con,
                    new Dictionary<string, object?>());

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt32(result) : 0;
            }
            finally { con?.Close(); }
        }

        public int ClearAuditLogs()
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_ClearAuditLogs", con,
                    new Dictionary<string, object?>());

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt32(result) : 0;
            }
            finally { con?.Close(); }
        }

        public bool DeleteSystemLog(long id)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_DeleteSystemLog", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public bool DeleteAuditLog(long id)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_DeleteAuditLog", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }
    }
}
