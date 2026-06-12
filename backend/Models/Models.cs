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
