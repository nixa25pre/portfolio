# Nixan Portfolio

Pure HTML / CSS / JavaScript portfolio with an admin panel powered by Google Sheets via Google Apps Script.

## Project structure

```
.
├── index.html          # Public portfolio
├── admin.html          # Admin login + dashboard
├── css/styles.css      # All styles + design tokens (light/dark)
├── js/
│   ├── api.js          # Apps Script API client (set URL here)
│   ├── app.js          # Portfolio behaviour
│   └── admin.js        # Admin CRUD behaviour
├── apps-script.gs      # Code to paste into Google Apps Script
├── robots.txt
└── README.md
```

## Run locally

It's pure static files — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

## Deploy

Upload the whole folder to **GitHub Pages**, **Netlify**, **Vercel**, **Cloudflare Pages**, or any static host.

## Backend setup (Google Sheets + Apps Script)

### 1. Create the Google Sheet

Add 5 tabs (sheet names matter, capitalization too):

| Tab | Columns (row 1) |
|---|---|
| **Skills**     | `ID` `Skill` `Category` `Percentage` |
| **Experience** | `ID` `Company` `Role` `Start Date` `End Date` `Description` `Technology` |
| **Education**  | `ID` `Degree` `College` `Year` `CGPA` |
| **Projects**   | `ID` `Project Name` `Description` `Technology` `GitHub URL` `Demo URL` `Image URL` |
| **Contact**    | `ID` `Name` `Email` `Subject` `Message` `Date` |

### 2. Deploy the Apps Script

1. In the sheet: **Extensions → Apps Script**
2. Paste the contents of `apps-script.gs`.
3. **Project Settings → Script Properties**, add:
   - `ADMIN_USERNAME` — your admin login
   - `ADMIN_PASSWORD` — your admin password
   - `RESUME_FILE_ID` — (optional) Drive file ID of your resume PDF, set to "Anyone with the link"
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the **Web app URL**.

### 3. Wire it into the site

Open `js/api.js` and paste your URL:

```js
window.APPS_SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
```

Reload the page. The portfolio now loads live data from the sheet, and `admin.html` lets you log in to manage everything.

Until `APPS_SCRIPT_URL` is set, the portfolio shows placeholder content so it always looks good.

## Pages

- `index.html` — Home, About, Skills, Experience, Education, Projects, Resume, Contact
- `admin.html` — Login + CRUD for Skills / Experience / Education / Projects, plus Messages inbox

Light/Dark mode toggle is in the header on both pages.
