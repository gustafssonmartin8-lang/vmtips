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
    };

    public static DateTime? GetKickoff(int matchId) =>
        _kickoffs.TryGetValue(matchId, out var dt) ? dt : null;

    // A match is locked once kickoff time has passed
    public static bool IsLockedNow(int matchId, DateTime nowUtc)
    {
        var kickoff = GetKickoff(matchId);
        if (kickoff == null) return false;  // unknown kickoff = not locked (knockout TBD)
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
