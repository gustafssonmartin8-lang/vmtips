using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VmTips.Data;
using VmTips.DTOs;
using VmTips.Models;
using VmTips.Services;
record VoteRequest(string Vote);

namespace VmTips.Endpoints;

public static class Endpoints
{
    public static void MapAll(WebApplication app)
    {
        MapAuth(app);
        MapMatches(app);
        MapTips(app);
        MapLeaderboard(app);
        MapLiveScores(app);
        MapPolls(app);
        MapApiStatus(app);
        MapAdmin(app);
    }

    static void MapAuth(WebApplication app)
    {
        app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db, AuthService auth) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
            if (user == null || !auth.VerifyPassword(req.Password, user.PasswordHash, user.Salt))
                return Results.Unauthorized();
            var groups = await db.UserGroups
                .Where(ug => ug.UserId == user.Id)
                .Include(ug => ug.Group)
                .Select(ug => new GroupDto(ug.Group.Id, ug.Group.Name))
                .ToListAsync();
            var token = auth.GenerateToken(user);
            return Results.Ok(new LoginResponse(token, user.Username, user.IsAdmin, user.Id, groups));
        });

        app.MapGet("/api/auth/me", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var id   = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var name = user.FindFirstValue(ClaimTypes.Name)!;
            var admin = bool.Parse(user.FindFirstValue("isAdmin")!);
            var groups = await db.UserGroups
                .Where(ug => ug.UserId == id)
                .Include(ug => ug.Group)
                .Select(ug => new GroupDto(ug.Group.Id, ug.Group.Name))
                .ToListAsync();
            return Results.Ok(new { UserId = id, Username = name, IsAdmin = admin, Groups = groups });
        }).RequireAuthorization();
    }

    static void MapMatches(WebApplication app)
    {
        app.MapGet("/api/matches", async (AppDbContext db) =>
        {
            var matches = await db.Matches.OrderBy(m => m.Id).ToListAsync();
            return matches.Select(m => new MatchDto(
                m.Id, m.HomeTeam, m.AwayTeam,
                m.HomeGoals, m.AwayGoals,
                m.MatchDate, m.Round, m.IsLocked));
        });
    }

    static void MapTips(WebApplication app)
    {
        // All users' tips filtered by group
        app.MapGet("/api/tips/all", async (int groupId, AppDbContext db) =>
        {
            var groupUserIds = await db.UserGroups
                .Where(ug => ug.GroupId == groupId)
                .Select(ug => ug.UserId)
                .ToListAsync();
            var users   = await db.Users.Where(u => groupUserIds.Contains(u.Id)).ToListAsync();
            var matches = await db.Matches.ToListAsync();
            var tips    = await db.Tips.Where(t => groupUserIds.Contains(t.UserId)).ToListAsync();
            var sidos   = await db.SidoTips.Where(s => groupUserIds.Contains(s.UserId)).ToListAsync();
            var answer  = await db.SidoAnswers.FirstOrDefaultAsync(a => a.GroupId == groupId);

            return users.Select(u =>
            {
                var userTips = tips.Where(t => t.UserId == u.Id).ToList();
                var sido     = sidos.FirstOrDefault(s => s.UserId == u.Id);
                var matchPts = userTips.Sum(t =>
                {
                    var m = matches.FirstOrDefault(m => m.Id == t.MatchId);
                    return m == null ? 0 : PointsService.CalcTipPoints(t, m);
                });
                var sidoPts = PointsService.CalcSidoPoints(sido, answer);
                return new UserTipsDto(
                    u.Id, u.Username,
                    userTips.Select(t =>
                    {
                        var m = matches.First(m => m.Id == t.MatchId);
                        return new TipDto(t.MatchId, t.HomeGoals, t.AwayGoals, PointsService.CalcTipPoints(t, m));
                    }).ToList(),
                    sido == null ? null : new SidoTipDto(sido.Skyttekung, sido.Assistkung, sido.GultKort),
                    matchPts, sidoPts, matchPts + sidoPts);
            });
        }).RequireAuthorization();

        app.MapGet("/api/tips/me", async (ClaimsPrincipal user, int groupId, AppDbContext db) =>
        {
            var userId  = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var matches = await db.Matches.ToListAsync();
            var tips    = await db.Tips.Where(t => t.UserId == userId).ToListAsync();
            var sido    = await db.SidoTips.FirstOrDefaultAsync(s => s.UserId == userId);
            var answer  = await db.SidoAnswers.FirstOrDefaultAsync(a => a.GroupId == groupId);
            var matchPts = tips.Sum(t =>
            {
                var m = matches.FirstOrDefault(m => m.Id == t.MatchId);
                return m == null ? 0 : PointsService.CalcTipPoints(t, m);
            });
            var sidoPts = PointsService.CalcSidoPoints(sido, answer);
            return Results.Ok(new UserTipsDto(
                userId, user.FindFirstValue(ClaimTypes.Name)!,
                tips.Select(t =>
                {
                    var m = matches.First(m => m.Id == t.MatchId);
                    return new TipDto(t.MatchId, t.HomeGoals, t.AwayGoals, PointsService.CalcTipPoints(t, m));
                }).ToList(),
                sido == null ? null : new SidoTipDto(sido.Skyttekung, sido.Assistkung, sido.GultKort),
                matchPts, sidoPts, matchPts + sidoPts));
        }).RequireAuthorization();

        app.MapPost("/api/tips", async (SaveTipRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var match  = await db.Matches.FindAsync(req.MatchId);
            if (match == null) return Results.NotFound();
            if (match.IsLocked) return Results.BadRequest("Matchen är låst.");
            var tip = await db.Tips.FirstOrDefaultAsync(t => t.UserId == userId && t.MatchId == req.MatchId);
            if (tip == null) { tip = new Tip { UserId = userId, MatchId = req.MatchId }; db.Tips.Add(tip); }
            tip.HomeGoals = req.HomeGoals;
            tip.AwayGoals = req.AwayGoals;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPost("/api/tips/sido", async (SidoTipDto req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sido   = await db.SidoTips.FirstOrDefaultAsync(s => s.UserId == userId);
            if (sido == null) { sido = new SidoTip { UserId = userId }; db.SidoTips.Add(sido); }
            sido.Skyttekung = req.Skyttekung;
            sido.Assistkung = req.Assistkung;
            sido.GultKort   = req.GultKort;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }

    static void MapLeaderboard(WebApplication app)
    {
        app.MapGet("/api/leaderboard", async (int groupId, AppDbContext db) =>
        {
            var groupUserIds = await db.UserGroups
                .Where(ug => ug.GroupId == groupId)
                .Select(ug => ug.UserId)
                .ToListAsync();
            var users   = await db.Users.Where(u => groupUserIds.Contains(u.Id)).ToListAsync();
            var matches = await db.Matches.ToListAsync();
            var tips    = await db.Tips.Where(t => groupUserIds.Contains(t.UserId)).ToListAsync();
            var sidos   = await db.SidoTips.Where(s => groupUserIds.Contains(s.UserId)).ToListAsync();
            var answer  = await db.SidoAnswers.FirstOrDefaultAsync(a => a.GroupId == groupId);

            return users.Select(u =>
            {
                var userTips = tips.Where(t => t.UserId == u.Id).ToList();
                var sido     = sidos.FirstOrDefault(s => s.UserId == u.Id);
                var matchPts = userTips.Sum(t =>
                {
                    var m = matches.FirstOrDefault(m => m.Id == t.MatchId);
                    return m == null ? 0 : PointsService.CalcTipPoints(t, m);
                });
                var sidoPts = PointsService.CalcSidoPoints(sido, answer);
                return new { u.Username, matchPts, sidoPts, total = matchPts + sidoPts };
            })
            .OrderByDescending(e => e.total)
            .ThenByDescending(e => e.matchPts)
            .Select((e, i) => new LeaderboardEntry(i + 1, e.Username, e.matchPts, e.sidoPts, e.total))
            .ToList();
        });
    }


    static void MapLiveScores(WebApplication app)
    {
        // Returns current live scores from in-memory cache
        app.MapGet("/api/livescores", () =>
        {
            var scores = LiveScoreCache.GetAll();
            return scores.Select(kvp => new {
                matchId = kvp.Key,
                homeGoals = kvp.Value.Home,
                awayGoals = kvp.Value.Away,
                status = kvp.Value.Status,
                elapsed = kvp.Value.Elapsed,
            });
        });
    }

        static void MapAdmin(WebApplication app)
    {
        app.MapGet("/api/admin/users", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var users = await db.Users
                .Include(u => u.UserGroups).ThenInclude(ug => ug.Group)
                .Select(u => new AdminUserDto(u.Id, u.Username, u.IsAdmin,
                    u.UserGroups.Select(ug => ug.Group.Name).ToList()))
                .ToListAsync();
            return Results.Ok(users);
        }).RequireAuthorization();

        app.MapGet("/api/admin/groups", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var groups = await db.Groups.Select(g => new GroupDto(g.Id, g.Name)).ToListAsync();
            return Results.Ok(groups);
        }).RequireAuthorization();

        app.MapPost("/api/admin/groups", async (CreateGroupRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var g = new Group { Name = req.Name };
            db.Groups.Add(g);
            await db.SaveChangesAsync();
            await db.SidoAnswers.AddAsync(new SidoAnswer { GroupId = g.Id });
            await db.SaveChangesAsync();
            return Results.Ok(new GroupDto(g.Id, g.Name));
        }).RequireAuthorization();

        app.MapPost("/api/admin/groups/adduser", async (AddUserToGroupRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            if (await db.UserGroups.AnyAsync(ug => ug.UserId == req.UserId && ug.GroupId == req.GroupId))
                return Results.Ok();
            db.UserGroups.Add(new UserGroup { UserId = req.UserId, GroupId = req.GroupId });
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPost("/api/admin/users", async (CreateUserRequest req, AppDbContext db, AuthService auth, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            if (await db.Users.AnyAsync(u => u.Username == req.Username))
                return Results.BadRequest("Användarnamnet finns redan.");
            var salt = auth.GenerateSalt();
            var newUser = new User
            {
                Username     = req.Username,
                Salt         = salt,
                PasswordHash = auth.HashPassword(req.Password, salt),
                IsAdmin      = req.IsAdmin,
            };
            db.Users.Add(newUser);
            await db.SaveChangesAsync();
            foreach (var gid in req.GroupIds)
                db.UserGroups.Add(new UserGroup { UserId = newUser.Id, GroupId = gid });
            await db.SaveChangesAsync();
            return Results.Ok(new AdminUserDto(newUser.Id, newUser.Username, newUser.IsAdmin, req.GroupIds.Select(g => g.ToString()).ToList()));
        }).RequireAuthorization();

        app.MapPut("/api/admin/users/{id}/password", async (int id, UpdatePasswordRequest req, AppDbContext db, AuthService auth, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var target = await db.Users.FindAsync(id);
            if (target == null) return Results.NotFound();
            target.Salt         = auth.GenerateSalt();
            target.PasswordHash = auth.HashPassword(req.NewPassword, target.Salt);
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPut("/api/admin/matches/{id}", async (int id, SetResultRequest req, AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var match = await db.Matches.FindAsync(id);
            if (match == null) return Results.NotFound();
            match.HomeGoals = req.HomeGoals;
            match.AwayGoals = req.AwayGoals;
            if (req.HomeTeam != null) match.HomeTeam = req.HomeTeam;
            if (req.AwayTeam != null) match.AwayTeam = req.AwayTeam;
            match.IsLocked  = req.IsLocked;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPut("/api/admin/sido/{groupId}", async (int groupId, SidoAnswerDto req, AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var ans = await db.SidoAnswers.FirstOrDefaultAsync(a => a.GroupId == groupId);
            if (ans == null) { ans = new SidoAnswer { GroupId = groupId }; db.SidoAnswers.Add(ans); }
            ans.Skyttekung = req.Skyttekung;
            ans.Assistkung = req.Assistkung;
            ans.GultKort   = req.GultKort;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapGet("/api/admin/sido/{groupId}", async (int groupId, AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var ans = await db.SidoAnswers.FirstOrDefaultAsync(a => a.GroupId == groupId);
            return Results.Ok(new SidoAnswerDto(ans?.Skyttekung, ans?.Assistkung, ans?.GultKort));
        }).RequireAuthorization();
    }



    static void MapPolls(WebApplication app)
    {
        // Get poll results for a match (anonymous - just counts)
        app.MapGet("/api/polls/{matchId}", async (int matchId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var votes = await db.MatchPolls
                .Where(p => p.MatchId == matchId)
                .GroupBy(p => p.Vote)
                .Select(g => new { vote = g.Key, count = g.Count() })
                .ToListAsync();

            var myVote = await db.MatchPolls
                .Where(p => p.MatchId == matchId && p.UserId == userId)
                .Select(p => p.Vote)
                .FirstOrDefaultAsync();

            var total = votes.Sum(v => v.count);
            return Results.Ok(new {
                matchId,
                myVote,
                total,
                votes = new {
                    home = votes.FirstOrDefault(v => v.vote == "1")?.count ?? 0,
                    draw = votes.FirstOrDefault(v => v.vote == "X")?.count ?? 0,
                    away = votes.FirstOrDefault(v => v.vote == "2")?.count ?? 0,
                }
            });
        }).RequireAuthorization();

        // Cast a vote
        app.MapPost("/api/polls/{matchId}", async (int matchId, VoteRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (req.Vote != "1" && req.Vote != "X" && req.Vote != "2")
                return Results.BadRequest("Vote must be 1, X or 2");

            var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            // Check if match is locked
            var match = await db.Matches.FindAsync(matchId);
            if (match == null) return Results.NotFound();
            if (match.IsLocked) return Results.BadRequest("Match has started");

            // Only one vote per user per match
            var existing = await db.MatchPolls
                .FirstOrDefaultAsync(p => p.MatchId == matchId && p.UserId == userId);

            if (existing != null)
                return Results.BadRequest("Already voted");

            db.MatchPolls.Add(new MatchPoll {
                MatchId = matchId,
                UserId = userId,
                Vote = req.Vote
            });

            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }

    static void MapApiStatus(WebApplication app)
    {
        app.MapGet("/api/admin/apistatus", (ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            return Results.Ok(new {
                requestsToday = ResultFetcherService.RequestsToday,
                maxPerDay = 80,
                remaining = 80 - ResultFetcherService.RequestsToday,
                date = DateOnly.FromDateTime(DateTime.UtcNow).ToString()
            });
        }).RequireAuthorization();
    }

        static bool IsAdmin(ClaimsPrincipal user) =>
        bool.TryParse(user.FindFirstValue("isAdmin"), out var v) && v;
}
