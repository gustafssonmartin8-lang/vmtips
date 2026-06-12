using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VmTips.Data;
using VmTips.DTOs;
using VmTips.Models;
using VmTips.Services;

namespace VmTips.Endpoints;

public static class Endpoints
{
    public static void MapAll(WebApplication app)
    {
        MapAuth(app);
        MapMatches(app);
        MapTips(app);
        MapLeaderboard(app);
        MapAdmin(app);
    }

    // ── AUTH ──────────────────────────────────────────────────────
    static void MapAuth(WebApplication app)
    {
        app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db, AuthService auth) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
            if (user == null || !auth.VerifyPassword(req.Password, user.PasswordHash, user.Salt))
                return Results.Unauthorized();
            var token = auth.GenerateToken(user);
            return Results.Ok(new LoginResponse(token, user.Username, user.IsAdmin, user.Id));
        });

        app.MapGet("/api/auth/me", (ClaimsPrincipal user) =>
        {
            var id   = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var name = user.FindFirstValue(ClaimTypes.Name)!;
            var admin = bool.Parse(user.FindFirstValue("isAdmin")!);
            return Results.Ok(new { UserId = id, Username = name, IsAdmin = admin });
        }).RequireAuthorization();
    }

    // ── MATCHES ───────────────────────────────────────────────────
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

    // ── TIPS ──────────────────────────────────────────────────────
    static void MapTips(WebApplication app)
    {
        // Get all users' tips (for leaderboard view)
        app.MapGet("/api/tips/all", async (AppDbContext db) =>
        {
            var users   = await db.Users.ToListAsync();
            var matches = await db.Matches.ToListAsync();
            var tips    = await db.Tips.ToListAsync();
            var sidos   = await db.SidoTips.ToListAsync();
            var answer  = await db.SidoAnswers.FirstOrDefaultAsync();

            return users.Select(u =>
            {
                var userTips = tips.Where(t => t.UserId == u.Id).ToList();
                var sido     = sidos.FirstOrDefault(s => s.UserId == u.Id);
                var matchPts = userTips.Sum(t =>
                {
                    var match = matches.FirstOrDefault(m => m.Id == t.MatchId);
                    return match == null ? 0 : PointsService.CalcTipPoints(t, match);
                });
                var sidoPts = PointsService.CalcSidoPoints(sido, answer);
                return new UserTipsDto(
                    u.Id, u.Username,
                    userTips.Select(t =>
                    {
                        var m = matches.First(m => m.Id == t.MatchId);
                        return new TipDto(t.MatchId, t.HomeGoals, t.AwayGoals,
                            PointsService.CalcTipPoints(t, m));
                    }).ToList(),
                    sido == null ? null : new SidoTipDto(sido.Skyttekung, sido.Assistkung, sido.GultKort),
                    matchPts, sidoPts, matchPts + sidoPts);
            });
        }).RequireAuthorization();

        // Get my tips
        app.MapGet("/api/tips/me", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId  = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var matches = await db.Matches.ToListAsync();
            var tips    = await db.Tips.Where(t => t.UserId == userId).ToListAsync();
            var sido    = await db.SidoTips.FirstOrDefaultAsync(s => s.UserId == userId);
            var answer  = await db.SidoAnswers.FirstOrDefaultAsync();

            var matchPts = tips.Sum(t =>
            {
                var m = matches.FirstOrDefault(m => m.Id == t.MatchId);
                return m == null ? 0 : PointsService.CalcTipPoints(t, m);
            });
            var sidoPts = PointsService.CalcSidoPoints(sido, answer);

            return Results.Ok(new UserTipsDto(
                userId,
                user.FindFirstValue(ClaimTypes.Name)!,
                tips.Select(t =>
                {
                    var m = matches.First(m => m.Id == t.MatchId);
                    return new TipDto(t.MatchId, t.HomeGoals, t.AwayGoals, PointsService.CalcTipPoints(t, m));
                }).ToList(),
                sido == null ? null : new SidoTipDto(sido.Skyttekung, sido.Assistkung, sido.GultKort),
                matchPts, sidoPts, matchPts + sidoPts));
        }).RequireAuthorization();

        // Save tip for a match
        app.MapPost("/api/tips", async (SaveTipRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var match  = await db.Matches.FindAsync(req.MatchId);
            if (match == null) return Results.NotFound();
            if (match.IsLocked) return Results.BadRequest("Matchen är låst.");

            var tip = await db.Tips.FirstOrDefaultAsync(t => t.UserId == userId && t.MatchId == req.MatchId);
            if (tip == null)
            {
                tip = new Tip { UserId = userId, MatchId = req.MatchId };
                db.Tips.Add(tip);
            }
            tip.HomeGoals = req.HomeGoals;
            tip.AwayGoals = req.AwayGoals;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        // Save sido-tip
        app.MapPost("/api/tips/sido", async (SidoTipDto req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sido   = await db.SidoTips.FirstOrDefaultAsync(s => s.UserId == userId);
            if (sido == null)
            {
                sido = new SidoTip { UserId = userId };
                db.SidoTips.Add(sido);
            }
            sido.Skyttekung = req.Skyttekung;
            sido.Assistkung = req.Assistkung;
            sido.GultKort   = req.GultKort;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }

    // ── LEADERBOARD ───────────────────────────────────────────────
    static void MapLeaderboard(WebApplication app)
    {
        app.MapGet("/api/leaderboard", async (AppDbContext db) =>
        {
            var users   = await db.Users.ToListAsync();
            var matches = await db.Matches.ToListAsync();
            var tips    = await db.Tips.ToListAsync();
            var sidos   = await db.SidoTips.ToListAsync();
            var answer  = await db.SidoAnswers.FirstOrDefaultAsync();

            var entries = users.Select(u =>
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

            return entries;
        });
    }

    // ── ADMIN ─────────────────────────────────────────────────────
    static void MapAdmin(WebApplication app)
    {
        // List users
        app.MapGet("/api/admin/users", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var users = await db.Users.Select(u => new AdminUserDto(u.Id, u.Username, u.IsAdmin)).ToListAsync();
            return Results.Ok(users);
        }).RequireAuthorization();

        // Create user
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
            return Results.Ok(new AdminUserDto(newUser.Id, newUser.Username, newUser.IsAdmin));
        }).RequireAuthorization();

        // Update user password
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

        // Set match result + lock
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

        // Set sido answers
        app.MapPut("/api/admin/sido", async (SidoAnswerDto req, AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var ans = await db.SidoAnswers.FindAsync(1);
            if (ans == null) { ans = new SidoAnswer { Id = 1 }; db.SidoAnswers.Add(ans); }
            ans.Skyttekung = req.Skyttekung;
            ans.Assistkung = req.Assistkung;
            ans.GultKort   = req.GultKort;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        // Get sido answers
        app.MapGet("/api/admin/sido", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            var ans = await db.SidoAnswers.FindAsync(1);
            return Results.Ok(new SidoAnswerDto(ans?.Skyttekung, ans?.Assistkung, ans?.GultKort));
        }).RequireAuthorization();
    }

    static bool IsAdmin(ClaimsPrincipal user) =>
        bool.TryParse(user.FindFirstValue("isAdmin"), out var v) && v;
}
