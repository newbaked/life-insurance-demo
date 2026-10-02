# Pioneer Life insurance application demo

This is a static, browser-only demo of a life insurance application form. It is
not a production insurance service and must not be used to collect real
applicant information.

## Privacy

- GitHub Pages is public hosting. Anyone can view the site and its source.
- Answers are saved in the current browser's local storage. They are not sent
  to a server, but anyone with access to that browser profile may be able to
  view them.
- Application JSON exports can contain personal, financial, and medical
  information. Do not enter real information or commit exports.
- The deployment workflow publishes only `index.html`, `css/`, and `js/`.
  The internal rule mapping, source/reference documents, and saved application
  exports are excluded from Git.

## Deploy to GitHub Pages for free

1. Create a new **public** repository on GitHub for this app. Do not add a
   README, license, or `.gitignore` there.
2. In PowerShell, open this folder and run the following commands, replacing
   the username and repository name:

   ```powershell
   git init -b main
   git add .
   git status --short
   ```

   Confirm that the status does **not** list an application JSON export, PDF,
   the business-rule mapping, or the `business Rules and Updated PDF` folder.
   Then commit and push:

   ```powershell
   git commit -m "Prepare life insurance demo for GitHub Pages"
   git remote add origin https://github.com/<username>/<repository>.git
   git push -u origin main
   ```

3. In the GitHub repository, open **Settings → Pages** and select **GitHub
   Actions** as the build and deployment source.
4. The included workflow publishes the app on each push to `main` or `master`.
   Find its public URL under **Settings → Pages** after the first deployment.

The free GitHub Pages plan requires a public repository for Pages hosting.
