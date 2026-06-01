using GeoPhoto.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoPhoto.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Photo> Photos => Set<Photo>();
}