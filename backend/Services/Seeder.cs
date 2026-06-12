using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using VmTips.Data;
using VmTips.Models;

namespace VmTips.Services;

public static class Seeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (await db.Matches.AnyAsync()) return; // already seeded

        // ── MATCHES ──────────────────────────────────────────────────
        var matches = new List<Match>
        {
            // GRUPP A
            new() { Id=1,  HomeTeam="Mexiko",              AwayTeam="Sydafrika",           HomeGoals=2, AwayGoals=0, MatchDate="2026-06-11", Round="Grupp A", IsLocked=true },
            new() { Id=2,  HomeTeam="Sydkorea",            AwayTeam="Tjeckien",            HomeGoals=2, AwayGoals=1, MatchDate="2026-06-12", Round="Grupp A", IsLocked=true },
            new() { Id=3,  HomeTeam="Tjeckien",            AwayTeam="Sydafrika",           MatchDate="2026-06-18", Round="Grupp A", IsLocked=true },
            new() { Id=4,  HomeTeam="Mexiko",              AwayTeam="Sydkorea",            MatchDate="2026-06-19", Round="Grupp A", IsLocked=true },
            new() { Id=5,  HomeTeam="Tjeckien",            AwayTeam="Mexiko",              MatchDate="2026-06-25", Round="Grupp A", IsLocked=true },
            new() { Id=6,  HomeTeam="Sydafrika",           AwayTeam="Sydkorea",            MatchDate="2026-06-25", Round="Grupp A", IsLocked=true },
            // GRUPP B
            new() { Id=7,  HomeTeam="Kanada",              AwayTeam="Bosnien-Hercegovina", MatchDate="2026-06-12", Round="Grupp B", IsLocked=true },
            new() { Id=8,  HomeTeam="Qatar",               AwayTeam="Schweiz",             MatchDate="2026-06-13", Round="Grupp B", IsLocked=true },
            new() { Id=9,  HomeTeam="Schweiz",             AwayTeam="Bosnien-Hercegovina", MatchDate="2026-06-18", Round="Grupp B", IsLocked=true },
            new() { Id=10, HomeTeam="Kanada",              AwayTeam="Qatar",               MatchDate="2026-06-19", Round="Grupp B", IsLocked=true },
            new() { Id=11, HomeTeam="Bosnien-Hercegovina", AwayTeam="Qatar",               MatchDate="2026-06-24", Round="Grupp B", IsLocked=true },
            new() { Id=12, HomeTeam="Schweiz",             AwayTeam="Kanada",              MatchDate="2026-06-24", Round="Grupp B", IsLocked=true },
            // GRUPP C
            new() { Id=13, HomeTeam="Brasilien",           AwayTeam="Marocko",             MatchDate="2026-06-14", Round="Grupp C", IsLocked=true },
            new() { Id=14, HomeTeam="Haiti",               AwayTeam="Skottland",           MatchDate="2026-06-14", Round="Grupp C", IsLocked=true },
            new() { Id=15, HomeTeam="Skottland",           AwayTeam="Marocko",             MatchDate="2026-06-20", Round="Grupp C", IsLocked=true },
            new() { Id=16, HomeTeam="Brasilien",           AwayTeam="Haiti",               MatchDate="2026-06-20", Round="Grupp C", IsLocked=true },
            new() { Id=17, HomeTeam="Marocko",             AwayTeam="Haiti",               MatchDate="2026-06-25", Round="Grupp C", IsLocked=true },
            new() { Id=18, HomeTeam="Skottland",           AwayTeam="Brasilien",           MatchDate="2026-06-25", Round="Grupp C", IsLocked=true },
            // GRUPP D
            new() { Id=19, HomeTeam="USA",                 AwayTeam="Paraguay",            MatchDate="2026-06-13", Round="Grupp D", IsLocked=true },
            new() { Id=20, HomeTeam="Australien",          AwayTeam="Turkiet",             MatchDate="2026-06-14", Round="Grupp D", IsLocked=true },
            new() { Id=21, HomeTeam="USA",                 AwayTeam="Australien",          MatchDate="2026-06-19", Round="Grupp D", IsLocked=true },
            new() { Id=22, HomeTeam="Turkiet",             AwayTeam="Paraguay",            MatchDate="2026-06-20", Round="Grupp D", IsLocked=true },
            new() { Id=23, HomeTeam="Turkiet",             AwayTeam="USA",                 MatchDate="2026-06-26", Round="Grupp D", IsLocked=true },
            new() { Id=24, HomeTeam="Paraguay",            AwayTeam="Australien",          MatchDate="2026-06-26", Round="Grupp D", IsLocked=true },
            // GRUPP E
            new() { Id=25, HomeTeam="Tyskland",            AwayTeam="Curacao",             MatchDate="2026-06-14", Round="Grupp E", IsLocked=true },
            new() { Id=26, HomeTeam="Elfenbenskusten",     AwayTeam="Ecuador",             MatchDate="2026-06-15", Round="Grupp E", IsLocked=true },
            new() { Id=27, HomeTeam="Tyskland",            AwayTeam="Elfenbenskusten",     MatchDate="2026-06-21", Round="Grupp E", IsLocked=true },
            new() { Id=28, HomeTeam="Ecuador",             AwayTeam="Curacao",             MatchDate="2026-06-21", Round="Grupp E", IsLocked=true },
            new() { Id=29, HomeTeam="Ecuador",             AwayTeam="Tyskland",            MatchDate="2026-06-26", Round="Grupp E", IsLocked=true },
            new() { Id=30, HomeTeam="Curacao",             AwayTeam="Elfenbenskusten",     MatchDate="2026-06-26", Round="Grupp E", IsLocked=true },
            // GRUPP F – SVERIGE ⭐
            new() { Id=31, HomeTeam="Nederländerna",       AwayTeam="Japan",               MatchDate="2026-06-15", Round="Grupp F", IsLocked=true },
            new() { Id=32, HomeTeam="Sverige",             AwayTeam="Tunisien",            MatchDate="2026-06-15", Round="Grupp F", IsLocked=true },
            new() { Id=33, HomeTeam="Nederländerna",       AwayTeam="Sverige",             MatchDate="2026-06-20", Round="Grupp F", IsLocked=true },
            new() { Id=34, HomeTeam="Tunisien",            AwayTeam="Japan",               MatchDate="2026-06-21", Round="Grupp F", IsLocked=true },
            new() { Id=35, HomeTeam="Japan",               AwayTeam="Sverige",             MatchDate="2026-06-26", Round="Grupp F", IsLocked=true },
            new() { Id=36, HomeTeam="Tunisien",            AwayTeam="Nederländerna",       MatchDate="2026-06-26", Round="Grupp F", IsLocked=true },
            // GRUPP G
            new() { Id=37, HomeTeam="Belgien",             AwayTeam="Egypten",             MatchDate="2026-06-15", Round="Grupp G", IsLocked=true },
            new() { Id=38, HomeTeam="Iran",                AwayTeam="Nya Zeeland",         MatchDate="2026-06-16", Round="Grupp G", IsLocked=true },
            new() { Id=39, HomeTeam="Belgien",             AwayTeam="Iran",                MatchDate="2026-06-21", Round="Grupp G", IsLocked=true },
            new() { Id=40, HomeTeam="Nya Zeeland",         AwayTeam="Egypten",             MatchDate="2026-06-22", Round="Grupp G", IsLocked=true },
            new() { Id=41, HomeTeam="Nya Zeeland",         AwayTeam="Belgien",             MatchDate="2026-06-27", Round="Grupp G", IsLocked=true },
            new() { Id=42, HomeTeam="Egypten",             AwayTeam="Iran",                MatchDate="2026-06-27", Round="Grupp G", IsLocked=true },
            // GRUPP H
            new() { Id=43, HomeTeam="Spanien",             AwayTeam="Kap Verde",           MatchDate="2026-06-15", Round="Grupp H", IsLocked=true },
            new() { Id=44, HomeTeam="Saudiarabien",        AwayTeam="Uruguay",             MatchDate="2026-06-16", Round="Grupp H", IsLocked=true },
            new() { Id=45, HomeTeam="Spanien",             AwayTeam="Saudiarabien",        MatchDate="2026-06-21", Round="Grupp H", IsLocked=true },
            new() { Id=46, HomeTeam="Uruguay",             AwayTeam="Kap Verde",           MatchDate="2026-06-22", Round="Grupp H", IsLocked=true },
            new() { Id=47, HomeTeam="Uruguay",             AwayTeam="Spanien",             MatchDate="2026-06-27", Round="Grupp H", IsLocked=true },
            new() { Id=48, HomeTeam="Kap Verde",           AwayTeam="Saudiarabien",        MatchDate="2026-06-27", Round="Grupp H", IsLocked=true },
            // GRUPP I
            new() { Id=49, HomeTeam="Frankrike",           AwayTeam="Senegal",             MatchDate="2026-06-16", Round="Grupp I", IsLocked=true },
            new() { Id=50, HomeTeam="Irak",                AwayTeam="Norge",               MatchDate="2026-06-17", Round="Grupp I", IsLocked=true },
            new() { Id=51, HomeTeam="Frankrike",           AwayTeam="Irak",                MatchDate="2026-06-22", Round="Grupp I", IsLocked=true },
            new() { Id=52, HomeTeam="Norge",               AwayTeam="Senegal",             MatchDate="2026-06-23", Round="Grupp I", IsLocked=true },
            new() { Id=53, HomeTeam="Senegal",             AwayTeam="Irak",                MatchDate="2026-06-26", Round="Grupp I", IsLocked=true },
            new() { Id=54, HomeTeam="Norge",               AwayTeam="Frankrike",           MatchDate="2026-06-26", Round="Grupp I", IsLocked=true },
            // GRUPP J
            new() { Id=55, HomeTeam="Argentina",           AwayTeam="Algeriet",            MatchDate="2026-06-17", Round="Grupp J", IsLocked=true },
            new() { Id=56, HomeTeam="Österrike",           AwayTeam="Jordanien",           MatchDate="2026-06-17", Round="Grupp J", IsLocked=true },
            new() { Id=57, HomeTeam="Argentina",           AwayTeam="Österrike",           MatchDate="2026-06-22", Round="Grupp J", IsLocked=true },
            new() { Id=58, HomeTeam="Jordanien",           AwayTeam="Algeriet",            MatchDate="2026-06-23", Round="Grupp J", IsLocked=true },
            new() { Id=59, HomeTeam="Jordanien",           AwayTeam="Argentina",           MatchDate="2026-06-28", Round="Grupp J", IsLocked=true },
            new() { Id=60, HomeTeam="Algeriet",            AwayTeam="Österrike",           MatchDate="2026-06-28", Round="Grupp J", IsLocked=true },
            // GRUPP K
            new() { Id=61, HomeTeam="Portugal",            AwayTeam="Kongo-Kinshasa",      MatchDate="2026-06-17", Round="Grupp K", IsLocked=true },
            new() { Id=62, HomeTeam="Uzbekistan",          AwayTeam="Colombia",            MatchDate="2026-06-18", Round="Grupp K", IsLocked=true },
            new() { Id=63, HomeTeam="Portugal",            AwayTeam="Uzbekistan",          MatchDate="2026-06-23", Round="Grupp K", IsLocked=true },
            new() { Id=64, HomeTeam="Colombia",            AwayTeam="Kongo-Kinshasa",      MatchDate="2026-06-24", Round="Grupp K", IsLocked=true },
            new() { Id=65, HomeTeam="Kongo-Kinshasa",      AwayTeam="Uzbekistan",          MatchDate="2026-06-28", Round="Grupp K", IsLocked=true },
            new() { Id=66, HomeTeam="Colombia",            AwayTeam="Portugal",            MatchDate="2026-06-28", Round="Grupp K", IsLocked=true },
            // GRUPP L
            new() { Id=67, HomeTeam="England",             AwayTeam="Kroatien",            MatchDate="2026-06-18", Round="Grupp L", IsLocked=true },
            new() { Id=68, HomeTeam="Ghana",               AwayTeam="Panama",              MatchDate="2026-06-18", Round="Grupp L", IsLocked=true },
            new() { Id=69, HomeTeam="England",             AwayTeam="Ghana",               MatchDate="2026-06-24", Round="Grupp L", IsLocked=true },
            new() { Id=70, HomeTeam="Panama",              AwayTeam="Kroatien",            MatchDate="2026-06-24", Round="Grupp L", IsLocked=true },
            new() { Id=71, HomeTeam="Panama",              AwayTeam="England",             MatchDate="2026-06-28", Round="Grupp L", IsLocked=true },
            new() { Id=72, HomeTeam="Kroatien",            AwayTeam="Ghana",               MatchDate="2026-06-28", Round="Grupp L", IsLocked=true },
            // SLUTSPEL
            new() { Id=73, Round="Åttondelsfinal", IsLocked=false },
            new() { Id=74, Round="Åttondelsfinal", IsLocked=false },
            new() { Id=75, Round="Åttondelsfinal", IsLocked=false },
            new() { Id=76, Round="Åttondelsfinal", IsLocked=false },
            new() { Id=77, Round="Åttondelsfinal", IsLocked=false },
            new() { Id=78, Round="Åttondelsfinal", IsLocked=false },
            new() { Id=79, Round="Åttondelsfinal", IsLocked=false },
            new() { Id=80, Round="Åttondelsfinal", IsLocked=false },
            new() { Id=81, Round="Kvartsfinal", IsLocked=false },
            new() { Id=82, Round="Kvartsfinal", IsLocked=false },
            new() { Id=83, Round="Kvartsfinal", IsLocked=false },
            new() { Id=84, Round="Kvartsfinal", IsLocked=false },
            new() { Id=85, Round="Semifinal", IsLocked=false },
            new() { Id=86, Round="Semifinal", IsLocked=false },
            new() { Id=87, Round="Match om 3:e plats", IsLocked=false },
            new() { Id=88, Round="Final", IsLocked=false },
        };
        await db.Matches.AddRangeAsync(matches);

        // ── USERS ─────────────────────────────────────────────────────
        var usersData = new[]
        {
            (name:"Martin",  pass:"Martin2026!",  admin:true),
            (name:"Martha",  pass:"Martha2026!",  admin:false),
            (name:"Linn",    pass:"Linn2026!",    admin:false),
            (name:"Sebbe",   pass:"Sebbe2026!",   admin:false),
            (name:"Maths",   pass:"Maths2026!",   admin:false),
            (name:"Anette",  pass:"Anette2026!",  admin:false),
        };

        var users = new List<User>();
        foreach (var (name, pass, admin) in usersData)
        {
            var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
            var hash = HashPassword(pass, salt);
            users.Add(new User { Username = name, PasswordHash = hash, Salt = salt, IsAdmin = admin });
        }
        await db.Users.AddRangeAsync(users);
        await db.SaveChangesAsync();

        // ── TIPS ──────────────────────────────────────────────────────
        var tipData = new Dictionary<string, Dictionary<int,(int h,int a)>>
        {
            ["Martin"] = new() {
                {1,(3,0)},{2,(2,1)},{3,(1,0)},{4,(2,1)},{5,(2,1)},{6,(1,2)},
                {7,(1,2)},{8,(1,3)},{9,(1,0)},{10,(2,0)},{11,(1,1)},{12,(2,1)},
                {13,(3,0)},{14,(1,2)},{15,(1,1)},{16,(4,0)},{17,(2,1)},{18,(0,3)},
                {19,(2,0)},{20,(1,1)},{21,(2,1)},{22,(1,2)},{23,(1,1)},{24,(2,1)},
                {25,(3,0)},{26,(2,1)},{27,(2,1)},{28,(3,0)},{29,(1,2)},{30,(0,3)},
                {31,(2,1)},{32,(2,0)},{33,(1,2)},{34,(1,2)},{35,(1,2)},{36,(1,3)},
                {37,(2,1)},{38,(2,0)},{39,(2,1)},{40,(1,2)},{41,(0,2)},{42,(2,1)},
                {43,(3,0)},{44,(1,2)},{45,(2,0)},{46,(3,1)},{47,(1,2)},{48,(1,3)},
                {49,(3,1)},{50,(1,2)},{51,(3,0)},{52,(1,2)},{53,(2,1)},{54,(0,3)},
                {55,(3,0)},{56,(1,2)},{57,(2,1)},{58,(1,2)},{59,(0,3)},{60,(1,2)},
                {61,(3,0)},{62,(1,2)},{63,(3,0)},{64,(2,1)},{65,(1,3)},{66,(1,3)},
                {67,(2,1)},{68,(2,1)},{69,(3,1)},{70,(1,2)},{71,(0,2)},{72,(2,1)},
            },
            ["Martha"] = new() {
                {1,(3,1)},{2,(2,1)},{3,(1,1)},{4,(2,2)},{5,(1,2)},{6,(2,1)},
                {7,(2,1)},{8,(0,2)},{9,(2,1)},{10,(2,1)},{11,(2,1)},{12,(1,2)},
                {13,(2,0)},{14,(0,2)},{15,(0,2)},{16,(3,1)},{17,(2,0)},{18,(0,2)},
                {19,(2,1)},{20,(1,2)},{21,(2,0)},{22,(2,1)},{23,(1,2)},{24,(1,2)},
                {25,(4,0)},{26,(1,2)},{27,(2,0)},{28,(2,0)},{29,(0,2)},{30,(0,2)},
                {31,(3,1)},{32,(1,2)},{33,(2,1)},{34,(0,2)},{35,(1,2)},{36,(0,3)},
                {37,(3,1)},{38,(1,0)},{39,(2,0)},{40,(1,2)},{41,(0,3)},{42,(2,1)},
                {43,(3,0)},{44,(0,2)},{45,(3,0)},{46,(2,1)},{47,(0,3)},{48,(1,2)},
                {49,(2,0)},{50,(0,2)},{51,(2,1)},{52,(1,2)},{53,(1,2)},{54,(0,2)},
                {55,(2,0)},{56,(0,2)},{57,(2,1)},{58,(1,2)},{59,(0,3)},{60,(1,2)},
                {61,(2,0)},{62,(0,2)},{63,(3,0)},{64,(2,1)},{65,(0,2)},{66,(0,3)},
                {67,(2,0)},{68,(1,2)},{69,(2,1)},{70,(0,2)},{71,(0,2)},{72,(1,2)},
            },
            ["Linn"] = new() {
                {1,(2,0)},{2,(0,0)},{3,(1,0)},{4,(1,1)},{5,(1,1)},{6,(1,1)},
                {7,(2,1)},{8,(1,1)},{9,(1,0)},{10,(2,1)},{11,(1,2)},{12,(2,1)},
                {13,(2,1)},{14,(1,1)},{15,(0,1)},{16,(3,0)},{17,(1,1)},{18,(0,2)},
                {19,(2,1)},{20,(1,1)},{21,(2,0)},{22,(1,1)},{23,(0,2)},{24,(1,2)},
                {25,(3,0)},{26,(1,1)},{27,(2,1)},{28,(2,1)},{29,(0,2)},{30,(0,1)},
                {31,(2,0)},{32,(2,1)},{33,(1,2)},{34,(1,1)},{35,(0,2)},{36,(0,2)},
                {37,(2,0)},{38,(2,1)},{39,(2,0)},{40,(1,2)},{41,(0,2)},{42,(2,1)},
                {43,(3,0)},{44,(1,1)},{45,(2,1)},{46,(2,0)},{47,(1,2)},{48,(1,2)},
                {49,(2,1)},{50,(0,2)},{51,(3,0)},{52,(1,1)},{53,(1,1)},{54,(0,2)},
                {55,(2,0)},{56,(1,1)},{57,(2,0)},{58,(1,1)},{59,(0,2)},{60,(1,1)},
                {61,(2,0)},{62,(1,1)},{63,(3,0)},{64,(2,1)},{65,(1,2)},{66,(1,2)},
                {67,(2,0)},{68,(2,1)},{69,(2,1)},{70,(0,2)},{71,(0,2)},{72,(1,2)},
            },
            ["Sebbe"] = new() {
                {1,(1,1)},{2,(2,1)},{3,(2,0)},{4,(2,1)},{5,(1,2)},{6,(1,2)},
                {7,(2,1)},{8,(1,2)},{9,(1,1)},{10,(2,1)},{11,(2,1)},{12,(2,1)},
                {13,(2,1)},{14,(1,2)},{15,(1,2)},{16,(3,1)},{17,(2,1)},{18,(1,3)},
                {19,(2,0)},{20,(1,2)},{21,(2,1)},{22,(2,1)},{23,(1,2)},{24,(1,2)},
                {25,(3,0)},{26,(2,1)},{27,(2,1)},{28,(2,1)},{29,(1,2)},{30,(1,2)},
                {31,(2,1)},{32,(2,1)},{33,(1,2)},{34,(1,2)},{35,(2,1)},{36,(1,2)},
                {37,(2,1)},{38,(2,0)},{39,(2,1)},{40,(1,2)},{41,(1,2)},{42,(2,1)},
                {43,(2,0)},{44,(1,2)},{45,(2,1)},{46,(2,1)},{47,(1,2)},{48,(1,2)},
                {49,(2,1)},{50,(1,2)},{51,(2,0)},{52,(1,2)},{53,(1,2)},{54,(0,2)},
                {55,(2,1)},{56,(1,2)},{57,(2,1)},{58,(1,2)},{59,(1,3)},{60,(0,2)},
                {61,(2,0)},{62,(1,2)},{63,(2,0)},{64,(2,1)},{65,(1,2)},{66,(1,2)},
                {67,(2,1)},{68,(2,1)},{69,(2,1)},{70,(1,2)},{71,(0,2)},{72,(1,2)},
            },
            ["Maths"] = new() {
                {1,(2,0)},{2,(1,1)},{3,(2,0)},{4,(2,1)},{5,(1,2)},{6,(1,2)},
                {7,(2,1)},{8,(0,2)},{9,(1,1)},{10,(2,0)},{11,(1,2)},{12,(2,1)},
                {13,(3,0)},{14,(1,2)},{15,(0,2)},{16,(3,0)},{17,(2,1)},{18,(0,3)},
                {19,(2,1)},{20,(1,2)},{21,(2,1)},{22,(1,2)},{23,(1,2)},{24,(1,2)},
                {25,(3,0)},{26,(1,2)},{27,(2,0)},{28,(2,1)},{29,(1,2)},{30,(0,2)},
                {31,(2,1)},{32,(2,1)},{33,(1,2)},{34,(1,2)},{35,(1,2)},{36,(1,2)},
                {37,(2,0)},{38,(2,1)},{39,(2,0)},{40,(0,2)},{41,(0,2)},{42,(2,1)},
                {43,(2,0)},{44,(0,2)},{45,(2,1)},{46,(2,1)},{47,(1,3)},{48,(0,2)},
                {49,(2,0)},{50,(1,2)},{51,(2,1)},{52,(1,2)},{53,(1,2)},{54,(0,2)},
                {55,(3,0)},{56,(1,2)},{57,(2,1)},{58,(0,2)},{59,(0,3)},{60,(1,2)},
                {61,(3,0)},{62,(1,2)},{63,(3,0)},{64,(2,1)},{65,(0,2)},{66,(1,3)},
                {67,(2,0)},{68,(2,1)},{69,(3,0)},{70,(1,2)},{71,(0,2)},{72,(2,1)},
            },
            ["Anette"] = new() {
                {1,(1,2)},{2,(3,2)},{3,(1,2)},{4,(2,2)},{5,(2,1)},{6,(2,1)},
                {7,(1,2)},{8,(1,3)},{9,(2,1)},{10,(1,2)},{11,(1,2)},{12,(2,1)},
                {13,(2,1)},{14,(2,1)},{15,(1,2)},{16,(3,0)},{17,(2,1)},{18,(1,3)},
                {19,(1,2)},{20,(2,1)},{21,(1,2)},{22,(2,1)},{23,(2,1)},{24,(1,2)},
                {25,(2,1)},{26,(2,1)},{27,(1,2)},{28,(2,1)},{29,(2,1)},{30,(1,2)},
                {31,(2,1)},{32,(1,2)},{33,(2,1)},{34,(2,1)},{35,(2,1)},{36,(1,2)},
                {37,(1,2)},{38,(1,2)},{39,(2,1)},{40,(2,1)},{41,(1,2)},{42,(1,2)},
                {43,(2,1)},{44,(2,1)},{45,(1,2)},{46,(2,1)},{47,(2,1)},{48,(1,2)},
                {49,(2,1)},{50,(1,2)},{51,(2,1)},{52,(2,1)},{53,(1,2)},{54,(1,2)},
                {55,(2,1)},{56,(1,2)},{57,(2,1)},{58,(1,2)},{59,(0,2)},{60,(2,1)},
                {61,(2,1)},{62,(1,2)},{63,(2,1)},{64,(2,1)},{65,(1,2)},{66,(0,2)},
                {67,(2,1)},{68,(1,2)},{69,(2,1)},{70,(1,2)},{71,(1,2)},{72,(2,1)},
            },
        };

        var dbUsers = await db.Users.ToListAsync();
        var tips = new List<Tip>();
        foreach (var (uname, userTips) in tipData)
        {
            var user = dbUsers.First(u => u.Username == uname);
            foreach (var (matchId, (h, a)) in userTips)
                tips.Add(new Tip { UserId = user.Id, MatchId = matchId, HomeGoals = h, AwayGoals = a });
        }
        await db.Tips.AddRangeAsync(tips);

        // ── SIDO-TIPS ─────────────────────────────────────────────────
        var sidoData = new Dictionary<string,(string? sky, string? ast, string? gul)>
        {
            ["Martin"] = ("Erling Haaland",  "Lamine Yamal",    "Casemiro"),
            ["Martha"] = ("Memphis Depay",   "Ousmane Dembele", "Maxim de Cuyper"),
            ["Linn"]   = ("Kylian Mbappé",   "Bruno Fernandes", "Cristian Romero"),
            ["Sebbe"]  = (null, null, null),
            ["Maths"]  = ("Harry Kane",      "Ousmane Dembele", "Rüdiger"),
            ["Anette"] = ("Raphinha",        "Raphinha",        "Isak Hien"),
        };
        var sidoTips = new List<SidoTip>();
        foreach (var (uname, (sky, ast, gul)) in sidoData)
        {
            var user = dbUsers.First(u => u.Username == uname);
            sidoTips.Add(new SidoTip { UserId = user.Id, Skyttekung = sky, Assistkung = ast, GultKort = gul });
        }
        await db.SidoTips.AddRangeAsync(sidoTips);
        await db.SidoAnswers.AddAsync(new SidoAnswer { Id = 1 });

        await db.SaveChangesAsync();
    }

    private static string HashPassword(string password, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        return Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password, saltBytes,
            KeyDerivationPrf.HMACSHA256,
            iterationCount: 100_000,
            numBytesRequested: 32));
    }
}
