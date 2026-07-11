using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VmTips.Data;
using VmTips.DTOs;
using VmTips.Models;
using VmTips.Services;

namespace VmTips.Endpoints;

record VoteRequest(string Vote);

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
        MapComments(app);
        MapRecap(app);
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
            var now = DateTime.UtcNow;
            return matches.Select(m => {
                // Knockout rounds lock at the round's first kickoff; group matches at own kickoff.
                // ForceLocked-matcher låses oavsett tid (hanteras i IsLockedNow).
                bool locked;
                DateTime? locksAt;
                if (MatchTimeService.RoundMatchIds.ContainsKey(m.Round))
                {
                    locksAt = MatchTimeService.GetRoundStart(m.Round);
                    locked = MatchTimeService.IsLockedNow(m.Id, now, m.Round);
                }
                else if (MatchTimeService.ForceLocked.Contains(m.Id))
                {
                    locksAt = MatchTimeService.GetKickoff(m.Id);
                    locked = true;
                }
                else
                {
                    locksAt = MatchTimeService.GetKickoff(m.Id);
                    locked = locksAt != null ? now >= locksAt.Value : m.IsLocked;
                }
                return new MatchDto(
                    m.Id, m.HomeTeam, m.AwayTeam,
                    m.HomeGoals, m.AwayGoals,
                    m.MatchDate, m.Round, locked,
                    locksAt?.ToString("o"),
                    MatchTimeService.GetKickoff(m.Id)?.ToString("o"));
            });
        });
    }

    static void MapTips(WebApplication app)
    {
        // All users' tips filtered by group
        app.MapGet("/api/tips/all", async (int groupId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var requesterId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var now = DateTime.UtcNow;

            var groupUserIds = await db.UserGroups
                .Where(ug => ug.GroupId == groupId)
                .Select(ug => ug.UserId)
                .ToListAsync();
            var users    = await db.Users.Where(u => groupUserIds.Contains(u.Id)).ToListAsync();
            var matchMap = await db.Matches.ToDictionaryAsync(m => m.Id);
            var tips     = await db.Tips.Where(t => groupUserIds.Contains(t.UserId)).ToListAsync();
            var sidos    = await db.SidoTips.Where(s => groupUserIds.Contains(s.UserId)).ToListAsync();
            var answer   = await db.SidoAnswers.FirstOrDefaultAsync(a => a.GroupId == groupId);

            var tipsByUser = tips.GroupBy(t => t.UserId).ToDictionary(g => g.Key, g => g.ToList());
            var sidoByUser = sidos.ToDictionary(s => s.UserId);

            // En match är "synlig" för andra spelare först när den är låst.
            bool MatchLocked(Match m) =>
                MatchTimeService.IsLockedNow(m.Id, now,
                    MatchTimeService.RoundMatchIds.ContainsKey(m.Round) ? m.Round : null);

            return users.Select(u =>
            {
                var userTips = tipsByUser.GetValueOrDefault(u.Id) ?? new List<Tip>();
                var sido     = sidoByUser.GetValueOrDefault(u.Id);
                var isSelf   = u.Id == requesterId;
                var matchPts = userTips.Sum(t =>
                    matchMap.TryGetValue(t.MatchId, out var m) ? PointsService.CalcTipPoints(t, m) : 0);
                var sidoPts  = PointsService.CalcSidoPoints(sido, answer);

                var tipDtos = userTips
                    .Where(t => matchMap.ContainsKey(t.MatchId))
                    .Select(t =>
                    {
                        var m = matchMap[t.MatchId];
                        // Andras tips döljs tills matchen är låst (eget tips alltid synligt)
                        if (!isSelf && !MatchLocked(m))
                            return new TipDto(t.MatchId, 0, 0, 0, IsHidden: true);
                        return new TipDto(t.MatchId, t.HomeGoals, t.AwayGoals, PointsService.CalcTipPoints(t, m));
                    }).ToList();

                // Sido-tips är låsta sedan länge och visas för alla
                SidoTipDto? sidoDto = sido == null ? null
                    : new SidoTipDto(sido.Skyttekung, sido.Assistkung, sido.GultKort);

                return new UserTipsDto(
                    u.Id, u.Username, tipDtos, sidoDto,
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
            if (MatchTimeService.IsLockedNow(req.MatchId, DateTime.UtcNow, match.Round))
                return Results.BadRequest("Matchen är låst.");
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
            // För slutspelsmatcher styr admin lagen helt (tomt fält = rensa tillbaka till TBD).
            // För gruppmatcher rörs aldrig lagen (de är seedade).
            bool isKnockout = !match.Round.StartsWith("Grupp");
            if (isKnockout)
            {
                match.HomeTeam = string.IsNullOrWhiteSpace(req.HomeTeam) ? null : req.HomeTeam.Trim();
                match.AwayTeam = string.IsNullOrWhiteSpace(req.AwayTeam) ? null : req.AwayTeam.Trim();
            }
            match.IsLocked  = req.IsLocked;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        // Populate the 16 Sextondelsfinal (R32) matches (DB-id 89-104) with computed pairings.
        // Team names come from the client bracket logic (FIFA Annex C). Guarded: admin + all group matches played.
        app.MapPost("/api/admin/bracket/r32", async (PopulateR32Request req, AppDbContext db, ClaimsPrincipal user) =>
        {
            if (!IsAdmin(user)) return Results.Forbid();
            if (req.Pairs == null || req.Pairs.Count != 16)
                return Results.BadRequest("Förväntade 16 paringar.");

            var groupPlayed = await db.Matches
                .Where(m => m.Round.StartsWith("Grupp") && m.HomeGoals != null)
                .CountAsync();
            if (groupPlayed < 72)
                return Results.BadRequest($"Gruppspelet ej klart ({groupPlayed}/72 spelade).");

            // R32 DB ids are 89..104 in pairing order
            for (int i = 0; i < 16; i++)
            {
                var id = 89 + i;
                var match = await db.Matches.FindAsync(id);
                if (match == null) continue;
                match.HomeTeam = req.Pairs[i].HomeTeam;
                match.AwayTeam = req.Pairs[i].AwayTeam;
            }
            await db.SaveChangesAsync();
            return Results.Ok(new { updated = 16 });
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
            // Omröstning stänger vid matchens EGEN avspark (inte rond-låset som styr tippning)
            var kickoff = MatchTimeService.GetKickoff(matchId);
            if (kickoff != null && DateTime.UtcNow >= kickoff.Value)
                return Results.BadRequest("Match has started");

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

    static void MapComments(WebApplication app)
    {
        // Hämta kommentarer för en grupp (nyaste sist)
        app.MapGet("/api/comments", async (int groupId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            // Bara medlemmar i gruppen får läsa
            var isMember = await db.UserGroups.AnyAsync(ug => ug.GroupId == groupId && ug.UserId == userId);
            if (!isMember) return Results.Forbid();

            var comments = await db.Comments
                .Where(c => c.GroupId == groupId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id, c.UserId, c.Text, c.CreatedAt,
                    Username = c.User.Username,
                    Reactions = c.Reactions.Select(r => new { r.Emoji, r.UserId }).ToList()
                })
                .ToListAsync();

            var dto = comments.Select(c => new CommentDto(
                c.Id, c.UserId, c.Username, c.Text, c.CreatedAt.ToString("o"),
                c.UserId == userId,
                c.Reactions
                    .GroupBy(r => r.Emoji)
                    .Select(g => new ReactionGroupDto(g.Key, g.Count(), g.Any(x => x.UserId == userId)))
                    .OrderByDescending(r => r.Count)
                    .ToList()
            )).ToList();

            return Results.Ok(dto);
        }).RequireAuthorization();

        // Posta en kommentar
        app.MapPost("/api/comments", async (PostCommentRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isMember = await db.UserGroups.AnyAsync(ug => ug.GroupId == req.GroupId && ug.UserId == userId);
            if (!isMember) return Results.Forbid();

            var text = (req.Text ?? "").Trim();
            if (text.Length == 0) return Results.BadRequest("Tom kommentar.");
            if (text.Length > 500) text = text[..500];

            var comment = new Comment { GroupId = req.GroupId, UserId = userId, Text = text, CreatedAt = DateTime.UtcNow };
            db.Comments.Add(comment);
            await db.SaveChangesAsync();
            return Results.Ok(new { comment.Id });
        }).RequireAuthorization();

        // Radera egen kommentar (eller admin)
        app.MapDelete("/api/comments/{id}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var comment = await db.Comments.FindAsync(id);
            if (comment == null) return Results.NotFound();
            if (comment.UserId != userId && !IsAdmin(user)) return Results.Forbid();
            db.Comments.Remove(comment);
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        // Toggla emoji-reaktion på en kommentar
        app.MapPost("/api/comments/{id}/react", async (int id, ReactRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var comment = await db.Comments.FindAsync(id);
            if (comment == null) return Results.NotFound();
            var isMember = await db.UserGroups.AnyAsync(ug => ug.GroupId == comment.GroupId && ug.UserId == userId);
            if (!isMember) return Results.Forbid();

            var emoji = (req.Emoji ?? "").Trim();
            if (emoji.Length == 0) return Results.BadRequest("Tom emoji.");

            var existing = await db.CommentReactions
                .FirstOrDefaultAsync(r => r.CommentId == id && r.UserId == userId && r.Emoji == emoji);
            if (existing != null) db.CommentReactions.Remove(existing);   // toggle av
            else db.CommentReactions.Add(new CommentReaction { CommentId = id, UserId = userId, Emoji = emoji });
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }

    static void MapRecap(WebApplication app)
    {
        // Recap: matcher som fått resultat sedan användaren senast tittade,
        // med allas tips + poäng. Scopat till en grupp.
        app.MapGet("/api/recap", async (int groupId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var me = await db.Users.FindAsync(userId);
            if (me == null) return Results.NotFound();

            var isMember = await db.UserGroups.AnyAsync(ug => ug.GroupId == groupId && ug.UserId == userId);
            if (!isMember) return Results.Forbid();

            var since = me.LastSeenRecapAt;
            var groupUserIds = await db.UserGroups
                .Where(ug => ug.GroupId == groupId).Select(ug => ug.UserId).ToListAsync();
            var usersById = await db.Users
                .Where(u => groupUserIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.Username);

            // Spelade matcher (har resultat)
            var played = await db.Matches
                .Where(m => m.HomeGoals != null && m.AwayGoals != null)
                .ToListAsync();

            // Filtrera på avspark efter "senast sedd" (första gången: visa inget gammalt)
            var recent = played
                .Select(m => new { m, kick = MatchTimeService.GetKickoff(m.Id) })
                .Where(x => x.kick != null && (since == null ? false : x.kick > since))
                .OrderBy(x => x.kick)
                .ToList();

            var allTips = await db.Tips.Where(t => groupUserIds.Contains(t.UserId)).ToListAsync();
            var tipsByMatch = allTips.GroupBy(t => t.MatchId).ToDictionary(g => g.Key, g => g.ToList());

            var matchDtos = recent.Select(x =>
            {
                var m = x.m;
                var tips = (tipsByMatch.GetValueOrDefault(m.Id) ?? new List<Tip>())
                    .Select(t => new RecapTipDto(
                        usersById.GetValueOrDefault(t.UserId, "?"),
                        t.HomeGoals, t.AwayGoals, PointsService.CalcTipPoints(t, m)))
                    .OrderByDescending(t => t.Points)
                    .ToList();
                return new RecapMatchDto(
                    m.Id, m.HomeTeam, m.AwayTeam, m.HomeGoals!.Value, m.AwayGoals!.Value,
                    m.Round, x.kick?.ToString("o"), tips);
            }).ToList();

            return Results.Ok(new RecapDto(matchDtos));
        }).RequireAuthorization();

        // Markera recap som sett (sätter tidsstämpel till nu)
        app.MapPost("/api/recap/seen", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var me = await db.Users.FindAsync(userId);
            if (me == null) return Results.NotFound();
            me.LastSeenRecapAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }

        static bool IsAdmin(ClaimsPrincipal user) =>
        bool.TryParse(user.FindFirstValue("isAdmin"), out var v) && v;
}
