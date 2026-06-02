using GeoPhoto.API.Data;
using GeoPhoto.API.DTOs;
using GeoPhoto.API.Models;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SystemIO = System.IO;
using GeoPhoto.API.Services;
namespace GeoPhoto.API.Controllers;


[ApiController]
[Route("api/photos")]
[Authorize]
public class PhotoController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly AiDescriptionService _ai;
    private readonly IServiceScopeFactory _scopeFactory;

    public PhotoController(AppDbContext db, IWebHostEnvironment env, AiDescriptionService ai, IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _env = env;
        _ai = ai;
        _scopeFactory = scopeFactory;
    }

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided.");

        // Parse EXIF GPS data
        double? lat = null, lng = null;

        using (var stream = file.OpenReadStream())
        {
            var directories = ImageMetadataReader.ReadMetadata(stream);
            var gps = directories.OfType<GpsDirectory>().FirstOrDefault();

            if (gps != null)
            {
                var location = gps.GetGeoLocation();
                if (location != null)
                {
                    lat = location.Latitude;
                    lng = location.Longitude;
                }
            }
        }

        if (lat == null || lng == null)
            return BadRequest("Image has no GPS geotag. Please upload a geotagged photo.");

        // Save file
        var uploadsPath = Path.Combine(_env.ContentRootPath, "uploads");
        SystemIO.Directory.CreateDirectory(uploadsPath);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        // Save to DB
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var photo = new Photo
        {
            UserId = userId,
            FileName = fileName,
            Latitude = lat.Value,
            Longitude = lng.Value
        };

        _db.Photos.Add(photo);
        await _db.SaveChangesAsync();

        var photoId = photo.Id;
        var scopeFactory = _scopeFactory;
        _ = Task.Run(async () =>
        {
            try
            {
                var description = await _ai.DescribeImageAsync(filePath);
                if (description != null)
                {
                    using var scope = scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var p = await db.Photos.FindAsync(photoId);
                    if (p != null)
                    {
                        p.AiDescription = description;
                        await db.SaveChangesAsync();
                        Console.WriteLine($"AI description saved: {description}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Background task failed: {ex.Message}");
            }
        });

        return Ok(ToResponse(photo));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var photos = await _db.Photos.ToListAsync();
        return Ok(photos.Select(ToResponse));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var photo = await _db.Photos.FindAsync(id);
        if (photo == null) return NotFound();
        return Ok(ToResponse(photo));
    }

    private PhotoResponse ToResponse(Photo p) => new(
        p.Id,
        p.FileName,
        p.Latitude,
        p.Longitude,
        p.AiDescription,
        p.CreatedAt,
        $"/uploads/{p.FileName}"
    );
}