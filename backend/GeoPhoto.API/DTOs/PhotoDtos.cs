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

public record CommentResponse(
    Guid Id,
    string Text,
    string Email,
    DateTime CreatedAt
);

public record AddCommentRequest(string Text);