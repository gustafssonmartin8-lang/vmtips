using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VmTips.Models;

public class User
{
    public int Id { get; set; }
    [Required] public string Username { get; set; } = "";
    [Required] public string PasswordHash { get; set; } = "";
    [Required] public string Salt { get; set; } = "";
    public bool IsAdmin { get; set; }
    public ICollection<Tip> Tips { get; set; } = new List<Tip>();
    public SidoTip? SidoTip { get; set; }
    public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();
}

public class Group
{
    public int Id { get; set; }
    [Required] public string Name { get; set; } = "";
    public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();
    public SidoAnswer? SidoAnswer { get; set; }
}

public class UserGroup
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
}

public class Match
{
    public int Id { get; set; }
    public string? HomeTeam { get; set; }
    public string? AwayTeam { get; set; }
    public int? HomeGoals { get; set; }
    public int? AwayGoals { get; set; }
    public string? MatchDate { get; set; }
    public string Round { get; set; } = "";
    public bool IsLocked { get; set; } = false;
    public ICollection<Tip> Tips { get; set; } = new List<Tip>();
}

public class Tip
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int MatchId { get; set; }
    public Match Match { get; set; } = null!;
    public int HomeGoals { get; set; }
    public int AwayGoals { get; set; }
}

public class SidoTip
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string? Skyttekung { get; set; }
    public string? Assistkung { get; set; }
    public string? GultKort { get; set; }
}

// One SidoAnswer per group
public class SidoAnswer
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public string? Skyttekung { get; set; }
    public string? Assistkung { get; set; }
    public string? GultKort { get; set; }
}
// Match poll votes (1X2)
public class MatchPoll
{
    public int Id { get; set; }
    public int MatchId { get; set; }
    public Match Match { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    // "1" = home win, "X" = draw, "2" = away win
    public string Vote { get; set; } = string.Empty;
}

// Group chat / "snack" comment
public class Comment
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    [Required] public string Text { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<CommentReaction> Reactions { get; set; } = new List<CommentReaction>();
}

// Emoji reaction on a comment (one emoji per user per comment)
public class CommentReaction
{
    public int Id { get; set; }
    public int CommentId { get; set; }
    public Comment Comment { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    [Required] public string Emoji { get; set; } = "";
}
