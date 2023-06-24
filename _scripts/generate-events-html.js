const fs = require('fs');

const DATE_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const COL_URL = 0;
const COL_DATE = 1;
const COL_START = 2;
const COL_END = 3;
const COL_ORGANIZER = 4;
const COL_LOCATION = 5;
const COL_PRICE = 6;
const COL_BACHATA = 7;
const COL_SALSA = 8;
const COL_KIZOMBA = 9;
const COL_URBANKIZ = 10;
const COL_SBK = 11;
const COL_SB = 12;
const COL_BK = 13;

const GITHUB_HEADERS = new Headers({
  'Accept': 'application/vnd.github+json',
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

async function main() {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/Data?key=${process.env.GOOGLE_API_KEY}`);
  const data = await response.json();
  if (!data || data.error) {
    console.error(data.error);
    throw new Error('Response error');
  }

  if (!data || data.majorDimension !== 'ROWS' || !data.values || data.values.length === 0) {
    throw new Error('Unexpected majorDimension');
  }

  const rows = data.values;
  const header = rows[0];
  if (header[COL_URL] !== 'URL' && header[COL_DATE] !== 'Date') {
    throw new Error('Unexpected header: ' + header);
  }

  let eventsHTML = '';
  for (let i = 1; i < data.values.length; ++i) {
    const row = data.values[i];
    if (!row[COL_URL]) {
      continue;
    }

    const date = new Date(row[COL_DATE].split('.').reverse().join('-'));
    const dateWithoutYear = row[COL_DATE].replace(/\d{4}$/, '');
    const price =
      +row[COL_PRICE] === 0 ? ', free' :
      +row[COL_PRICE] > 0 ? `, ${row[COL_PRICE]}€` :
      '';

    const styleRows = [];
    if (row[COL_BACHATA] === 'TRUE') styleRows.push('<div class="bachata">Bachata</div>');
    if (row[COL_SALSA] === 'TRUE') styleRows.push('<div class="salsa">Salsa</div>');
    if (row[COL_KIZOMBA] === 'TRUE') styleRows.push('<div class="kizomba">Kizomba</div>');
    if (row[COL_URBANKIZ] === 'TRUE') styleRows.push('<div class="kizomba">Urbankiz</div>');
    if (row[COL_SBK] === 'TRUE') styleRows.push('<div class="mixed">SBK</div>');
    if (row[COL_SB] === 'TRUE') styleRows.push('<div class="mixed">Salsa/Bachata</div>');
    if (row[COL_BK] === 'TRUE') styleRows.push('<div class="mixed">Bachata/Kizomba</div>');
    if (styleRows.length === 0) {
      continue;
    }

    eventsHTML += `
<a href="${row[COL_URL]}" target="_blank" class="event-container">
  <div class="event-title"><b>${DATE_DAYS[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.</b> ${row[COL_START]} - ${row[COL_END]}</div>
  <div class="event-location"><span class="event-organizer">${row[COL_ORGANIZER]}</span>, ${row[COL_LOCATION]}${price}</div>
  <div class="dance-styles">
    ${styleRows.join('\n    ')}
  </div>
</a>
`;
  }

  const pageTemplate = fs.readFileSync('events.html.template', 'utf8');
  const pageHTML = pageTemplate.replace('EVENTS_PLACEHOLDER', eventsHTML);

  const githubEventsFile = await fetch('https://api.github.com/repos/helsbk/helsbk.github.io/contents/events.html', {
    method: 'GET',
    headers: GITHUB_HEADERS,
  }).then(response => response.json());

  if (pageHTML.trim() === Buffer.from(githubEventsFile.content, 'base64').toString('utf8').trim()) {
    console.log('HTML matches, skipping!');
    process.exit(0);
  }

  const result = await fetch('https://api.github.com/repos/helsbk/helsbk.github.io/contents/events.html', {
    method: 'PUT',
    body: JSON.stringify({
      message: 'Update events',
      committer: {
        name: 'KapsiBot',
        email: 'no-reply@hbry.fi'
      },
      content: Buffer.from(pageHTML).toString('base64'),
      sha: githubEventsFile.sha,
    }),
    headers: GITHUB_HEADERS,
  }).then(response => response.json());
  console.log('GitHub:', result.message);
}

main();
