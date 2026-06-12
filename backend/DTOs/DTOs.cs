namespace VmTips.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username, bool IsAdmin, int UserId);

public record MatchDto(
    int Id, string? HomeTeam, string? AwayTeam,
    int? HomeGoals, int? AwayGoals,
    string? MatchDate, string Round, bool IsLocked);

public record TipDto(int MatchId, int HomeGoals, int AwayGoals, int Points);
public record SaveTipRequest(int MatchId, int HomeGoals, int AwayGoals);

public record SidoTipDto(string? Skyttekung, string? Assistkung, string? GultKort);
public record SidoAnswerDto(string? Skyttekung, string? Assistkung, string? GultKort);

public record UserTipsDto(
    int UserId, string Username,
    List<TipDto> Tips,
    SidoTipDto? SidoTip,
    int MatchPoints, int SidoPoints, int TotalPoints);

public record LeaderboardEntry(
    int Rank, string Username, int MatchPoints, int SidoPoints, int TotalPoints);

public record AdminUserDto(int Id, string Username, bool IsAdmin);
public record CreateUserRequest(string Username, string Password, bool IsAdmin);
public record UpdatePasswordRequest(string NewPassword);
public record SetResultRequest(int? HomeGoals, int? AwayGoals, string? HomeTeam, string? AwayTeam, bool IsLocked);
