 Centralized Student Record System

Simple client-side student record demo (HTML/CSS/JS). Works on GitHub Pages.

 Files
- `index.html` — main app
- `style.css` — styles (light/dark)
- `script.js` — application logic
- `README.md` — this file

 Default logins
- Admin: `admin` / `admin123`
- Student sample: `12-1234-567` / `12-1234-567-0531` (birthdate 2005-05-31)

 How to publish on GitHub Pages
1. Create a new GitHub repository.
2. Upload all files to the repository root.
3. Go to Settings → Pages. Set source to `main` branch and root `/`.
4. Save; wait a minute. Visit `https://YOUR-USERNAME.github.io/REPO-NAME/`.

 Notes
- All data stored in `localStorage` (including uploaded images saved as Base64).
- Import/Export available under Admin → Import / Export.
- Theme preference is saved to localStorage.
