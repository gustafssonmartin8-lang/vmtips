namespace VmTips.Services;

public static class MatchTimeService
{
    // Match ID -> UTC kickoff (Swedish time UTC+2 minus 2h)
    private static readonly Dictionary<int, DateTime> _kickoffs = new()
    {
        {1, Utc("2026-06-11",19,00)},{2, Utc("2026-06-12",02,00)},
        {7, Utc("2026-06-12",19,00)},{8, Utc("2026-06-13",19,00)},
        {19,Utc("2026-06-13",01,00)},{13,Utc("2026-06-13",22,00)},
        {14,Utc("2026-06-14",01,00)},{20,Utc("2026-06-14",04,00)},
        {25,Utc("2026-06-14",17,00)},{31,Utc("2026-06-14",20,00)},
        {26,Utc("2026-06-14",23,00)},{32,Utc("2026-06-15",02,00)},
        {43,Utc("2026-06-15",16,00)},{37,Utc("2026-06-15",19,00)},
        {44,Utc("2026-06-15",22,00)},{38,Utc("2026-06-16",01,00)},
        {49,Utc("2026-06-16",19,00)},{50,Utc("2026-06-16",22,00)},
        {55,Utc("2026-06-17",01,00)},{56,Utc("2026-06-17",04,00)},
        {61,Utc("2026-06-17",17,00)},{67,Utc("2026-06-17",20,00)},
        {68,Utc("2026-06-17",23,00)},{62,Utc("2026-06-18",02,00)},
        {3, Utc("2026-06-18",16,00)},{9, Utc("2026-06-18",19,00)},
        {10,Utc("2026-06-18",22,00)},{4, Utc("2026-06-19",01,00)},
        {21,Utc("2026-06-19",19,00)},{15,Utc("2026-06-19",22,00)},
        {16,Utc("2026-06-20",00,30)},{22,Utc("2026-06-20",03,00)},
        {33,Utc("2026-06-20",17,00)},{27,Utc("2026-06-20",20,00)},
        {28,Utc("2026-06-21",00,00)},{34,Utc("2026-06-21",04,00)},
        {45,Utc("2026-06-21",16,00)},{39,Utc("2026-06-21",19,00)},
        {46,Utc("2026-06-21",22,00)},{40,Utc("2026-06-22",01,00)},
        {57,Utc("2026-06-22",17,00)},{51,Utc("2026-06-22",21,00)},
        {52,Utc("2026-06-23",00,00)},{58,Utc("2026-06-23",03,00)},
        {63,Utc("2026-06-23",17,00)},{69,Utc("2026-06-23",20,00)},
        {70,Utc("2026-06-23",23,00)},{64,Utc("2026-06-24",02,00)},
        {11,Utc("2026-06-24",19,00)},{12,Utc("2026-06-24",19,00)},
        {17,Utc("2026-06-24",22,00)},{18,Utc("2026-06-24",22,00)},
        {5, Utc("2026-06-25",01,00)},{6, Utc("2026-06-25",01,00)},
        {29,Utc("2026-06-25",20,00)},{30,Utc("2026-06-25",20,00)},
        {35,Utc("2026-06-25",23,00)},{36,Utc("2026-06-25",23,00)},
        {23,Utc("2026-06-26",02,00)},{24,Utc("2026-06-26",02,00)},
        {53,Utc("2026-06-26",19,00)},{54,Utc("2026-06-26",19,00)},
        {47,Utc("2026-06-27",00,00)},{48,Utc("2026-06-27",00,00)},
        {41,Utc("2026-06-27",03,00)},{42,Utc("2026-06-27",03,00)},
        {71,Utc("2026-06-27",21,00)},{72,Utc("2026-06-27",21,00)},
        {65,Utc("2026-06-27",23,30)},{66,Utc("2026-06-27",23,30)},
        {59,Utc("2026-06-28",02,00)},{60,Utc("2026-06-28",02,00)},
        // Sextondelsfinaler (R32) – DB-id 89-104. Svensk tid -2h = UTC. Kopplat till lag på id.
        {89, Utc("2026-06-28",19,00)},  // Sydafrika-Kanada 21:00 sv
        {90, Utc("2026-06-29",20,30)},  // Tyskland-Paraguay 22:30 sv
        {91, Utc("2026-06-30",01,00)},  // Nederländerna-Marocko 03:00 sv
        {92, Utc("2026-06-29",17,00)},  // Brasilien-Japan 19:00 sv
        {93, Utc("2026-06-30",21,00)},  // Frankrike-Sverige 23:00 sv
        {94, Utc("2026-06-30",17,00)},  // Elfenbenskusten-Norge 19:00 sv
        {95, Utc("2026-07-01",01,00)},  // Mexiko-Ecuador 03:00 sv
        {96, Utc("2026-07-01",16,00)},  // England-Kongo 18:00 sv
        {97, Utc("2026-07-02",00,00)},  // USA-Bosnien 02:00 sv
        {98, Utc("2026-07-01",20,00)},  // Belgien-Senegal 22:00 sv
        {99, Utc("2026-07-02",23,00)},  // Portugal-Kroatien 01:00 sv
        {100,Utc("2026-07-02",19,00)},  // Spanien-Österrike 21:00 sv
        {101,Utc("2026-07-03",03,00)},  // Schweiz-Algeriet 05:00 sv
        {102,Utc("2026-07-03",22,00)},  // Argentina-Kap Verde 00:00 sv
        {103,Utc("2026-07-04",01,30)},  // Colombia-Ghana 03:30 sv
        {104,Utc("2026-07-03",18,00)},  // Australien-Egypten 20:00 sv
    };

    // Which DB match-ids belong to each knockout round (for round-level locking)
    public static readonly Dictionary<string, int[]> RoundMatchIds = new()
    {
        ["Sextondelsfinal"] = new[] {89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104},
        ["Åttondelsfinal"]  = new[] {73,74,75,76,77,78,79,80},
        ["Kvartsfinal"]     = new[] {81,82,83,84},
        ["Semifinal"]       = new[] {85,86},
        ["Match om 3:e plats"] = new[] {87},
        ["Final"]           = new[] {88},
    };

    public static DateTime? GetKickoff(int matchId) =>
        _kickoffs.TryGetValue(matchId, out var dt) ? dt : null;

    // Matcher som ska vara låsta för tippning oavsett kickoff-tid.
    // Används för att stänga tippningen i förväg (t.ex. sista gruppomgången).
    public static readonly HashSet<int> ForceLocked = new()
    {
        59, 60, 65, 66, 71, 72,  // sista gruppmatcherna (Grupp J, K, L)
    };

    // Earliest kickoff among all matches in a knockout round (null if none known)
    public static DateTime? GetRoundStart(string round)
    {
        if (!RoundMatchIds.TryGetValue(round, out var ids)) return null;
        DateTime? earliest = null;
        foreach (var id in ids)
        {
            var k = GetKickoff(id);
            if (k != null && (earliest == null || k < earliest)) earliest = k;
        }
        return earliest;
    }

    // A match is locked once kickoff time has passed.
    // For knockout rounds the WHOLE round locks when the round's first match starts,
    // so all tips for that round must be in before the first match of the round.
    public static bool IsLockedNow(int matchId, DateTime nowUtc, string? round = null)
    {
        if (ForceLocked.Contains(matchId)) return true;
        if (round != null && RoundMatchIds.ContainsKey(round))
        {
            var roundStart = GetRoundStart(round);
            return roundStart != null && nowUtc >= roundStart.Value;
        }
        var kickoff = GetKickoff(matchId);
        if (kickoff == null) return false;  // unknown kickoff = not locked
        return nowUtc >= kickoff.Value;
    }

    // Active window: from kickoff until 3h after (covers live + FT confirmation)
    public static bool IsInFetchWindow(int matchId, DateTime nowUtc)
    {
        var kickoff = GetKickoff(matchId);
        if (kickoff == null) return false;
        return nowUtc >= kickoff.Value && nowUtc <= kickoff.Value.AddHours(3);
    }

    public static bool IsLiveNow(int matchId, DateTime nowUtc)
    {
        var kickoff = GetKickoff(matchId);
        if (kickoff == null) return false;
        return nowUtc >= kickoff.Value && nowUtc <= kickoff.Value.AddHours(2.5);
    }

    private static DateTime Utc(string date, int hour, int minute) =>
        DateTime.Parse($"{date}T{hour:D2}:{minute:D2}:00Z").ToUniversalTime();
}
