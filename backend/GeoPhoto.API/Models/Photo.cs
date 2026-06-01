namespace GeoPhoto.API.Models;

public class Photo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? AiDescription { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}