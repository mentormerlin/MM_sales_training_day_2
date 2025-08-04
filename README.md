# Mentor Merlin Quiz Portal

This repository contains a modern, responsive quiz portal built for **Mentor Merlin**.  It is designed to train new joiners and existing employees through process‑knowledge quizzes, and provide an administrative view of all results.

## Features

* **Multiple Question Types** – The platform currently ships with multiple‑choice questions but is easily extensible to true/false, fill‑in‑the‑blank and image‑based questions.
* **Randomisation** – Both the order of questions and the order of answer options are randomised per user to minimise cheating.
* **Time Limit** – The quiz is timed (15 minutes for 15 questions).  A countdown timer is displayed at the top of the quiz and will automatically submit the quiz when it reaches zero.
* **Single Attempt** – Each trainee must enter their name and email to start the quiz.  The quiz is restricted to one attempt per email; repeat attempts on the same device are prevented via `localStorage`.  You can swap this logic for a server‑side check if needed.
* **Instant Feedback** – Upon submission the user immediately sees their score, percentage and whether they passed (≥ 60 %).  A detailed review shows the correct answer and a brief explanation for each question.
* **Leader Board** – The **Admin** tab displays a sortable table of all quiz submissions from newest to oldest.  Results can be pulled from a connected Google Sheet (via Apps Script) or from the browser’s local storage as a fallback.
* **Mobile Responsive Design** – The site uses a simple, clean layout inspired by Mentor Merlin’s branding.  It includes a progress bar, clear instructions and large tap targets for mobile users.

## Folder Structure

```
website/
├── assets/            # Static assets (images, logos)
├── index.html         # Home page
├── quiz.html          # Quiz page
├── admin.html         # Admin leader board
├── style.css          # Shared styles
├── script.js          # Client‑side logic (quiz & admin)
├── questions.js       # Question data (imported on quiz page)
└── README.md          # Documentation and setup instructions
```

## Running Locally

You can open the HTML files directly in a browser, but to simulate hosting (e.g. with relative paths) it’s better to use a local web server:

```bash
# Navigate to the repository root
cd website
# Start a simple Python server
python3 -m http.server 8000
# Open your browser at http://localhost:8000/index.html
```

## Deploying to GitHub Pages

1. **Create a new GitHub repository** (e.g. `MentorMerlinQuiz`).  Push the contents of the `website` folder to the root of your repository.
2. Commit and push your changes.
3. In your repository settings, under **Pages**, choose the `main` (or relevant) branch and set the source to `/root`.  GitHub will deploy your site at `https://<username>.github.io/<repo>/`.
4. Send the `quiz.html` link (with optional query parameters) to trainees via email.  Each trainee must use a unique email address to ensure one attempt.

## Google Sheets Integration

To store results centrally and display them in the admin leader board across devices, you can connect the quiz to a Google Sheet via a Google Apps Script web app.  Below is an example Apps Script to get you started.

### 1. Prepare your Google Sheet

* Create a new Google Sheet with a header row: **Name**, **Email**, **Score**, **Percentage**, **Passed**, **Timestamp**.
* Note the spreadsheet ID from its URL.

### 2. Create an Apps Script

1. From the sheet, navigate to **Extensions → Apps Script**.
2. Delete any existing code and paste the following script:

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.name,
    data.email,
    data.score,
    data.percentage,
    data.passed,
    new Date(data.timestamp)
  ]);
  return ContentService.createTextOutput('success');
}

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const result = [];
  // skip header
  for (let i = 1; i < rows.length; i++) {
    const [name, email, score, percentage, passed, timestamp] = rows[i];
    result.push({ name, email, score, percentage, passed, timestamp });
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Save the script and click **Deploy → New deployment**.
4. Choose **Web app**, give it a name (e.g. “Quiz API”), set **Execute as** to *Me* and **Who has access** to *Anyone*.
5. Deploy the script and note the **Web app URL**.  It will look like `https://script.google.com/macros/s/AKfycb.../exec`.
6. Copy the unique script ID portion (the long alphanumeric string after `/s/` and before `/exec`).

### 3. Configure the Website

In `script.js` there are placeholder strings labelled `YOUR_SCRIPT_ID`.  Replace both occurrences with the script ID you copied.  For example:

```javascript
const scriptURL = 'https://script.google.com/macros/s/AKfycbABC123DEF456/exec';
const readURL   = 'https://script.google.com/macros/s/AKfycbABC123DEF456/exec?action=get';
```

Rebuild and redeploy your site.  Submissions will now be saved to your Google Sheet, and the admin page will fetch live results.

## Extending the Quiz

* **Additional Question Types** – To add true/false or fill‑in‑the‑blank questions, extend the question objects in `questions.js` with a `type` of `tf` or `fitb`, then handle their rendering and evaluation in `script.js`.
* **Images in Questions** – Provide a relative or absolute image URL via an `image` property on your question objects and add logic in `script.js` to display it.
* **Unique Links** – If you need unique links for each trainee, generate URLs containing query parameters (e.g. `quiz.html?id=abc123`), and record or validate them server‑side before allowing the quiz to start.

---

This project provides a strong foundation for Mentor Merlin to deliver engaging quizzes, capture trainee performance and maintain oversight via a leader board.  Feel free to adapt the styles, questions and logic to suit your organisation’s needs.