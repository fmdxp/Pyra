# Pyra Launcher - Hosted Production Backend Guide

This directory contains the hosted production backend setup for **Pyra Desktop Launcher**.

Pyra communicates with this API strictly via HTTPS to fetch game catalog metadata, versions, artwork, and direct CDN archive download URLs.

---

## 🏗️ Architecture Overview

```
+-----------------------------------------------------------------------+
|                             GITHUB REPO                               |
|                     backend/api/catalog.json                          |
+-----------------------------------------------------------------------+
                                   |
                         (Automatic Deployment)
                                   v
+-----------------------------------------------------------------------+
|                             VERCEL API                                |
|                   https://pyra-api.vercel.app/api/catalog            |
+-----------------------------------------------------------------------+
                                   |
                        HTTPS (JSON Metadata)
                                   v
+-----------------------------------------------------------------------+
|                        PYRA DESKTOP LAUNCHER                          |
+-----------------------------------------------------------------------+
                                   |
                  Direct Download from CDN (ZIP Archive)
                                   v
+-----------------------------------------------------------------------+
|                    CDN / OBJECT STORAGE (R2 / S3)                     |
|           https://cdn.example.com/games/neon-drift-1.2.0.zip          |
+-----------------------------------------------------------------------+
```

---

## 🚀 1-Click Deployment to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) -> **Add New Project**.
3. Import your repository and select the `backend` root folder.
4. Click **Deploy**.
5. Vercel will provide your production endpoint: `https://<your-project>.vercel.app/api/catalog`.

---

## 🎮 How to Publish a New Game or Update

### Step 1: Upload the Game ZIP Archive to your CDN
Upload your game archive (e.g. `neon-drift-1.3.0.zip`) to your preferred object storage provider:
- **Cloudflare R2** / **AWS S3**
- **Vercel Blob Storage**
- **GitHub Releases** (Free high-speed CDN for files up to 2 GB per release)

Copy the public direct HTTPS download URL (e.g. `https://cdn.example.com/games/neon-drift-1.3.0.zip`).

### Step 2: Update `backend/api/catalog.json`
Edit `backend/api/catalog.json` in your repository:

```json
{
  "games": [
    {
      "id": "neon-drift",
      "name": "Neon Drift: Overdrive",
      "version": "1.3.0",
      "description": "New expansion update featuring 5 new tracks!",
      "shortDescription": "Cyberpunk arcade racing action in a neon-drenched metropolis.",
      "genre": "Racing / Action",
      "developer": "HyperDrive Studios",
      "publisher": "Pyra Interactive",
      "releaseDate": "2026-03-01",
      "icon": "https://cdn.example.com/neon-drift/icon.png",
      "banner": "https://cdn.example.com/neon-drift/banner.jpg",
      "screenshots": [
        "https://cdn.example.com/neon-drift/shot1.jpg"
      ],
      "downloadUrl": "https://cdn.example.com/games/neon-drift-1.3.0.zip",
      "size": 524288000,
      "executable": "NeonDrift.exe",
      "featured": true,
      "rating": 4.9,
      "tags": ["Synthwave", "Racing"]
    }
  ]
}
```

### Step 3: Git Commit & Push
```bash
git add backend/api/catalog.json
git commit -m "Publish Neon Drift v1.3.0"
git push origin main
```
Vercel automatically updates the live API in seconds. All Pyra launcher users will automatically detect the **UPDATE AVAILABLE** notification!

---

## ⚙️ Launcher Configuration

In the Pyra Launcher UI (**Settings** page), you can enter your Vercel API catalog URL under **Catalog API Endpoint** to point your launcher to your custom hosted server:

`https://<your-project>.vercel.app/api/catalog`
