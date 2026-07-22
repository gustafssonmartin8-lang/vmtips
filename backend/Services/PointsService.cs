using VmTips.Models;

namespace VmTips.Services;

public static class PointsService
{
    public static int CalcTipPoints(Tip tip, Match match)
    {
        if (match.HomeGoals == null || match.AwayGoals == null) return 0;
        int rh = match.HomeGoals.Value, rb = match.AwayGoals.Value;
        if (tip.HomeGoals == rh && tip.AwayGoals == rb) return 5;
        int pts = 0;
        if (tip.HomeGoals == rh) pts++;
        if (tip.AwayGoals == rb) pts++;
        if (Math.Sign(tip.HomeGoals - tip.AwayGoals) == Math.Sign(rh - rb)) pts++;
        return pts;
    }

    public static int CalcSidoPoints(SidoTip? sido, SidoAnswer? answer)
    {
        if (sido == null || answer == null) return 0;
        int pts = 0;
        if (NamesMatch(sido.Skyttekung, answer.Skyttekung)) pts += 5;
        if (NamesMatch(sido.Assistkung, answer.Assistkung)) pts += 5;
        if (NamesMatch(sido.GultKort,   answer.GultKort))   pts += 5;
        return pts;
    }

    // Tolerant namnjämförelse: skiftlägesokänslig, accenter tas bort (é=e),
    // och "Mbappe" matchar "Kylian Mbappé" (ena namnet ingår i det andra som helt ord).
    static bool NamesMatch(string? a, string? b)
    {
        var na = Normalize(a);
        var nb = Normalize(b);
        if (na.Length == 0 || nb.Length == 0) return false;
        if (na == nb) return true;
        return ContainsWholeWords(na, nb) || ContainsWholeWords(nb, na);
    }

    static string Normalize(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return "";
        var formD = s.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var ch in formD)
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch)
                != System.Globalization.UnicodeCategory.NonSpacingMark)
                sb.Append(ch);
        // kollapsa flera mellanslag
        return string.Join(' ', sb.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    // Är "needle" en sekvens av hela ord i "hay"? ("mbappe" i "kylian mbappe" = ja)
    static bool ContainsWholeWords(string hay, string needle)
    {
        var hw = hay.Split(' ');
        var nw = needle.Split(' ');
        if (nw.Length > hw.Length) return false;
        for (int i = 0; i <= hw.Length - nw.Length; i++)
        {
            bool all = true;
            for (int j = 0; j < nw.Length; j++)
                if (hw[i + j] != nw[j]) { all = false; break; }
            if (all) return true;
        }
        return false;
    }
}
