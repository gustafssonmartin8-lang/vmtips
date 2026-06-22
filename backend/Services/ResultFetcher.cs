using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using VmTips.Data;
using VmTips.Models;

namespace VmTips.Services;

public class ResultFetcherService(
    IServiceScopeFactory scopeFactory,
    IConfiguration config,
    ILogger<ResultFetcherService> logger) : BackgroundService
{
    private readonly HttpClient _http = new();
    private const int LEAGUE_ID = 1;
    private const int SEASON    = 2026;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        logger.LogInformation("ResultFetcher startar – kollar var 5:e minut");
        while (!ct.IsCancellationRequested)
        {
            try { await CheckAndFetchResults(ct); }
            catch (Exception ex) { logger.LogError(ex, "Fel i ResultFetcher"); }
            await Task.Delay(TimeSpan.FromMinutes(5), ct);
        }
    }

    private async Task CheckAndFetchResults(CancellationToken ct)
    {
        var apiKey = config["ApiFootball:Key"];
        if (string.IsNullOrEmpty(apiKey)) return;

        using var scope = scopeFactory.CreateScope();
        var db  = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;

        // Hämta låsta matcher utan resultat
        var candidates = await db.Matches
            .Where(m => m.IsLocked && m.HomeGoals == null && m.HomeTeam != null)
            .ToListAsync(ct);

        // Filtrera på matchfönster: avspark+2h till avspark+3h
        var pending = candidates
            .Where(m => MatchTimeService.IsInFetchWindow(m.Id, now))
            .ToList();

        if (pending.Count == 0) return;

        logger.LogInformation("Hämtar resultat för {Count} matcher", pending.Count);

        // Hämta fixtures för idag och imorgon (täcker nattmatcher)
        var dates = new[] { now.ToString("yyyy-MM-dd"), now.AddDays(-1).ToString("yyyy-MM-dd") };
        var allFixtures = new List<FixtureResponse>();

        foreach (var date in dates)
        {
            var fixtures = await FetchFixtures(date, apiKey, ct);
            if (fixtures != null) allFixtures.AddRange(fixtures);
        }

        if (allFixtures.Count == 0) return;

        bool changed = false;
        foreach (var match in pending)
        {
            var fixture = allFixtures.FirstOrDefault(f =>
                IsTeamMatch(f.teams.home.name, match.HomeTeam!) &&
                IsTeamMatch(f.teams.away.name, match.AwayTeam!));

            if (fixture == null)
            {
                logger.LogWarning("Ingen fixture för {Home} vs {Away}", match.HomeTeam, match.AwayTeam);
                continue;
            }

            var status = fixture.fixture.status.@short;

            // Uppdatera live-score även under pågående match
            if (IsLiveStatus(status) || IsFinishedStatus(status))
            {
                if (fixture.goals.home != null && fixture.goals.away != null)
                {
                    bool wasNull = match.HomeGoals == null;
                    match.HomeGoals = fixture.goals.home;
                    match.AwayGoals = fixture.goals.away;

                    if (IsFinishedStatus(status))
                    {
                        logger.LogInformation("✅ FT: {Home} {H}-{A} {Away}",
                            match.HomeTeam, fixture.goals.home, fixture.goals.away, match.AwayTeam);
                    }
                    else
                    {
                        logger.LogInformation("⚽ LIVE {Min}': {Home} {H}-{A} {Away}",
                            fixture.fixture.status.elapsed,
                            match.HomeTeam, fixture.goals.home, fixture.goals.away, match.AwayTeam);
                        // Håll ej låst under live (så vi fortsätter polla)
                        match.HomeGoals = null; // Återställ – sparas via LiveScore-tabell istället
                        // Spara live-score i matchens kommentar (tillfällig lösning)
                        match.HomeGoals = fixture.goals.home;
                        match.AwayGoals = fixture.goals.away;
                    }
                    changed = true;
                }
            }
            else
            {
                logger.LogInformation("{Home} vs {Away}: {Status} – inte klar",
                    match.HomeTeam, match.AwayTeam, status);
            }
        }

        if (changed) await db.SaveChangesAsync(ct);
    }

    private async Task<List<FixtureResponse>?> FetchFixtures(string date, string apiKey, CancellationToken ct)
    {
        try
        {
            _http.DefaultRequestHeaders.Clear();
            _http.DefaultRequestHeaders.Add("x-apisports-key", apiKey);
            var url = $"https://v3.football.api-sports.io/fixtures?date={date}&league={LEAGUE_ID}&season={SEASON}";
            var resp = await _http.GetFromJsonAsync<ApiFootballResponse>(url, ct);
            logger.LogInformation("API: {Count} fixtures för {Date}", resp?.response?.Count ?? 0, date);
            return resp?.response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "API-anrop misslyckades för {Date}", date);
            return null;
        }
    }

    private static bool IsLiveStatus(string s) =>
        s is "1H" or "HT" or "2H" or "ET" or "BT" or "P" or "LIVE";

    private static bool IsFinishedStatus(string s) =>
        s is "FT" or "AET" or "PEN";

    private static readonly Dictionary<string, string[]> TeamMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Sverige"]             = ["Sweden"],
            ["Mexiko"]              = ["Mexico"],
            ["Brasilien"]           = ["Brazil"],
            ["Frankrike"]           = ["France"],
            ["Spanien"]             = ["Spain"],
            ["Tyskland"]            = ["Germany"],
            ["Nederländerna"]       = ["Netherlands"],
            ["Belgien"]             = ["Belgium"],
            ["Schweiz"]             = ["Switzerland"],
            ["Sydkorea"]            = ["South Korea"],
            ["Sydafrika"]           = ["South Africa"],
            ["Nya Zeeland"]         = ["New Zealand"],
            ["Kap Verde"]           = ["Cape Verde"],
            ["Elfenbenskusten"]     = ["Ivory Coast","Cote d'Ivoire","Côte d'Ivoire"],
            ["Kongo-Kinshasa"]      = ["DR Congo","Congo DR","Democratic Republic of Congo"],
            ["Bosnien-Hercegovina"] = ["Bosnia","Bosnia & Herzegovina","Bosnia and Herzegovina"],
            ["Saudiarabien"]        = ["Saudi Arabia"],
            ["Turkiet"]             = ["Turkey","Türkiye"],
            ["Curacao"]             = ["Curaçao","Curacao"],
            ["Österrike"]           = ["Austria"],
            ["Algeriet"]            = ["Algeria"],
            ["Tunisien"]            = ["Tunisia"],
            ["Marocko"]             = ["Morocco"],
            ["Egypten"]             = ["Egypt"],
            ["Jordanien"]           = ["Jordan"],
            ["Skottland"]           = ["Scotland"],
            ["Kroatien"]            = ["Croatia"],
            ["Norge"]               = ["Norway"],
            ["Irak"]                = ["Iraq"],
            ["Uruguay"]             = ["Uruguay"],
            ["Paraguay"]            = ["Paraguay"],
            ["Ecuador"]             = ["Ecuador"],
            ["Colombia"]            = ["Colombia"],
            ["Uzbekistan"]          = ["Uzbekistan"],
            ["Kanada"]              = ["Canada"],
        };

    private static bool IsTeamMatch(string apiName, string dbName)
    {
        if (string.Equals(apiName, dbName, StringComparison.OrdinalIgnoreCase)) return true;
        if (TeamMap.TryGetValue(dbName, out var aliases))
            return aliases.Any(a => string.Equals(apiName, a, StringComparison.OrdinalIgnoreCase));
        return false;
    }
}

// ── Live score cache (in-memory, inte sparad i DB) ───────────────
public static class LiveScoreCache
{
    private static readonly Dictionary<int, (int Home, int Away, string Status, int? Elapsed)> _scores = new();
    private static readonly Lock _lock = new();

    public static void Update(int matchId, int home, int away, string status, int? elapsed)
    {
        lock (_lock) { _scores[matchId] = (home, away, status, elapsed); }
    }

    public static (int Home, int Away, string Status, int? Elapsed)? Get(int matchId)
    {
        lock (_lock) { return _scores.TryGetValue(matchId, out var v) ? v : null; }
    }

    public static Dictionary<int, (int Home, int Away, string Status, int? Elapsed)> GetAll()
    {
        lock (_lock) { return new Dictionary<int, (int, int, string, int?)>(_scores); }
    }
}

record ApiFootballResponse(List<FixtureResponse> response);
record FixtureResponse(FixtureInfo fixture, TeamsInfo teams, GoalsInfo goals);
record FixtureInfo(int id, FixtureStatus status);
record FixtureStatus(string @short, int? elapsed);
record TeamsInfo(TeamInfo home, TeamInfo away);
record TeamInfo(int id, string name);
record GoalsInfo(int? home, int? away);
