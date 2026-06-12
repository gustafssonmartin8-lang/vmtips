using Microsoft.EntityFrameworkCore;
using VmTips.Models;

namespace VmTips.Data;

public class AppDbContext(DbContextOptions<AppDbContext> opts) : DbContext(opts)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<UserGroup> UserGroups => Set<UserGroup>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Tip> Tips => Set<Tip>();
    public DbSet<SidoTip> SidoTips => Set<SidoTip>();
    public DbSet<SidoAnswer> SidoAnswers => Set<SidoAnswer>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<UserGroup>().HasKey(ug => new { ug.UserId, ug.GroupId });
        b.Entity<Tip>().HasIndex(t => new { t.UserId, t.MatchId }).IsUnique();
        b.Entity<SidoTip>().HasIndex(s => s.UserId).IsUnique();
        b.Entity<SidoAnswer>().HasIndex(s => s.GroupId).IsUnique();
    }
}
