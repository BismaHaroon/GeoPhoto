namespace GeoPhoto.API.DTOs;

public record PhotoResponse(
    Guid Id,
    string FileName,
    double Latitude,
    double Longitude,
    string? AiDescription,
    DateTime CreatedAt,
    string ImageUrl
);