using GeoPhoto.API.Data;
using GeoPhoto.API.DTOs;
using GeoPhoto.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GeoPhoto.API.Controllers;

[ApiController]
[Route("api/photos/{photoId}/comments")]
[Authorize]
public class CommentController : ControllerBase
{
    private readonly AppDbContext _db;

    public CommentController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetComments(Guid photoId)
    {
        var comments = await _db.Comments
            .Include(c => c.User)
            .Where(c => c.PhotoId == photoId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return Ok(comments.Select(c => new CommentResponse(
            c.Id,
            c.Text,
            c.User.Email,
            c.CreatedAt
        )));
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(Guid photoId, AddCommentRequest req)
    {
        var photo = await _db.Photos.FindAsync(photoId);
        if (photo == null) return NotFound("Photo not found.");

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var comment = new Comment
        {
            PhotoId = photoId,
            UserId = userId,
            Text = req.Text
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(userId);
        return Ok(new CommentResponse(comment.Id, comment.Text, user!.Email, comment.CreatedAt));
    }
}