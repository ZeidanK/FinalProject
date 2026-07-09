using System.Text.Json;
using System.Text.Json.Serialization;

namespace FinalProjectAuthAPI.MatchingEngine
{
    public class BoolStringConverter : JsonConverter<bool>
    {
        public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var str = reader.GetString();
                if (str == "0") return false;
                if (str == "1") return true;
                if (bool.TryParse(str, out var b)) return b;
                return false;
            }
            if (reader.TokenType == JsonTokenType.True) return true;
            if (reader.TokenType == JsonTokenType.False) return false;
            return false;
        }

        public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
        {
            writer.WriteBooleanValue(value);
        }
    }
}
