using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace GeoPhoto.API.Services;

public class AiDescriptionService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public AiDescriptionService(IConfiguration config)
    {
        _http = new HttpClient();
        _apiKey = config["Gemini:ApiKey"]!;
    }

    public async Task<string?> DescribeImageAsync(string imagePath)
    {
        try
        {
            var imageBytes = await File.ReadAllBytesAsync(imagePath);
            var base64 = Convert.ToBase64String(imageBytes);
            var ext = Path.GetExtension(imagePath).ToLower().TrimStart('.');
            var mimeType = ext == "png" ? "image/png" : "image/jpeg";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new
                            {
                                inline_data = new
                                {
                                    mime_type = mimeType,
                                    data = base64
                                }
                            },
                            new
                            {
                                text = "Describe this photo in one sentence. Be concise and factual."
                            }
                        }
                    }
                }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _http.SendAsync(request);
            var json = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"Gemini response: {json}"); // temporary debug line

            using var doc = JsonDocument.Parse(json);
            return doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AI description failed: {ex.Message}");
            return null;
        }
    }
}