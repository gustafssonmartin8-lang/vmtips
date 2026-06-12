namespace VmTips.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username, bool IsAdmin, int UserId, List<GroupDto> Groups);

public record GroupDto(int Id, string Name);
public record MatchDto(int Id, string? HomeTeam, string? AwayTeam, int? HomeGoals, int? AwayGoals, string? MatchDate, string Round, bool IsLocked);
public record TipDto(int MatchId, int HomeGoals, int AwayGoals, int Points);
public record SaveTipRequest(int MatchId, int HomeGoals, int AwayGoals);
public record SidoTipDto(string? Skyttekung, string? Assistkung, string? GultKort);
public record SidoAnswerDto(string? Skyttekung, string? Assistkung, string? GultKort);

public record UserTipsDto(
    int UserId, string Username,
    List<TipDto> Tips,
    SidoTipDto? SidoTip,
    int MatchPoints, int SidoPoints, int TotalPoints);

public record LeaderboardEntry(int Rank, string Username, int MatchPoints, int SidoPoints, int TotalPoints);

public record AdminUserDto(int Id, string Username, bool IsAdmin, List<string> Groups);
public record CreateUserRequest(string Username, string Password, bool IsAdmin, List<int> GroupIds);
public record UpdatePasswordRequest(string NewPassword);
public record SetResultRequest(int? HomeGoals, int? AwayGoals, string? HomeTeam, string? AwayTeam, bool IsLocked);
public record CreateGroupRequest(string Name);
public record AddUserToGroupRequest(int UserId, int GroupId);
