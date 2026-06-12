# VM-Tips 2026 – Installations- och driftinstruktioner
## Förutsättningar
- Podman Desktop installerat och igång
- podman-compose installerat (`pip install podman-compose`)
- PowerShell (Windows 11)

---

## Starta applikationen (första gången)

Öppna PowerShell och navigera till projektmappen:

```powershell
cd C:\sökväg\till\vmtips
```

### Steg 1 – Bygg och starta alla containers

```powershell
podman-compose -f podman-compose.yml up --build -d
```

> ⚠️ Känd bugg i podman-compose med `depends_on`: om backend startar
> innan postgres är redo, kör detta:

```powershell
# Vänta 10 sekunder, starta sedan om backend
Start-Sleep -Seconds 10
podman start vmtips-backend
```

### Steg 2 – Verifiera att allt körs

```powershell
podman ps
```

Du ska se tre containers: `vmtips-postgres`, `vmtips-backend`, `vmtips-frontend`

### Steg 3 – Öppna appen

Gå till: **http://localhost:8080**

---

## Inloggningsuppgifter (förifyllda från Excel)

| Namn    | Lösenord      | Admin |
|---------|---------------|-------|
| Martin  | Martin2026!   | ✅    |
| Martha  | Martha2026!   |       |
| Linn    | Linn2026!     |       |
| Sebbe   | Sebbe2026!    |       |
| Maths   | Maths2026!    |       |
| Anette  | Anette2026!   |       |

> Byt lösenord via Admin-panelen efter första inloggning.

---

## Daglig användning

### Starta (efter omstart av datorn)

```powershell
cd C:\sökväg\till\vmtips
podman-compose -f podman-compose.yml up -d
# Vid behov:
podman start vmtips-backend
```

### Stoppa

```powershell
podman-compose -f podman-compose.yml down
```

### Stoppa och ta bort all data (reset)

```powershell
podman-compose -f podman-compose.yml down -v
```

---

## Admin-funktioner

Logga in som **Martin** och gå till Admin-fliken:

### Lägga in matchresultat
1. Gå till **Admin → Resultat**
2. Klicka **Redigera** på en match
3. Fyll i hemma- och bortamål
4. Se till att **Låst** är ikryssat
5. Klicka **Spara**

→ Poäng för alla spelare räknas ut automatiskt direkt.

### Slutspelsmatcher
Slutspelsmatcherna har tomma lagnamn. Fyll i:
1. Gå till **Admin → Resultat** → hitta åttondels/kvartsfinal etc.
2. Klicka Redigera → fyll i **hemmalag** och **bortalag**
3. Fyll i resultat och spara

### Sido-svar
1. Gå till **Admin → Sido-svar**
2. Fyll i vem som vann skyttekung/assistkung/gula kort
3. Spara → 5p delas ut automatiskt till de som gissade rätt

### Lägga till ny användare
1. Gå till **Admin → Användare**
2. Fyll i namn och lösenord → Skapa

---

## Publicering (produktionsmiljö)

För att publicera på en server, ändra i `podman-compose.yml`:

```yaml
AllowedOrigins: "https://din-domän.se"
```

Och i `frontend/nginx.conf`:
```nginx
proxy_pass http://vmtips-backend:5000/api/;
```

Byt även JWT-hemligheten till något unikt och långt i miljövariabeln `Jwt__Secret`.

---

## Felsökning

### Backend loggar
```powershell
podman logs vmtips-backend
```

### Postgres anslutning
```powershell
podman exec -it vmtips-postgres psql -U vmtips -d vmtips
```

### Frontend loggar
```powershell
podman logs vmtips-frontend
```

### Rebuild efter kodändring
```powershell
podman-compose -f podman-compose.yml up --build -d
```
