namespace FinalProjectAuthAPI.Models
{
    public class RealtimeEventEnvelope
    {
        public string EventType { get; set; } = string.Empty;
        public long? CompanyId { get; set; }
        public long? UserId { get; set; }
        public object Payload { get; set; } = new();
        public DateTime EmittedAtUtc { get; set; } = DateTime.UtcNow;
    }
}