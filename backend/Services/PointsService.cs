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
        if (!string.IsNullOrEmpty(sido.Skyttekung) && sido.Skyttekung == answer.Skyttekung) pts += 5;
        if (!string.IsNullOrEmpty(sido.Assistkung) && sido.Assistkung == answer.Assistkung) pts += 5;
        if (!string.IsNullOrEmpty(sido.GultKort)   && sido.GultKort   == answer.GultKort)   pts += 5;
        return pts;
    }
}
