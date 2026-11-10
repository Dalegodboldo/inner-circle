/**
 * Inner Circle reservations
 * Receives each reservation from the landing page, logs it in this Google Sheet,
 * keeps a running count per date on a Summary tab, and emails Dale.
 *
 * Setup (about 5 minutes):
 * 1. Create a Google Sheet named "Inner Circle Reservations".
 * 2. In the Sheet: Extensions > Apps Script. Delete the sample code, paste this file, and save.
 * 3. Deploy > New deployment > Select type: Web app.
 *    Execute as: Me. Who has access: Anyone. Click Deploy and approve the permissions.
 * 4. Copy the Web app URL and send it to Claude (it goes into the page's formEndpoint setting).
 */

var NOTIFY_EMAIL = 'Dale@CreateImpactNow.org';
var SHEET_NAME = 'Reservations';
var SUMMARY_NAME = 'Summary';
var HEADERS = [
  'Received', 'Day', 'Name', 'Company', 'Email', 'Mobile',
  'Members', 'Guests 3+', 'Under 3', "Children's ages", 'Pickup address',
  'Dietary needs', 'Upgrades', 'Notes', 'Estimated total', 'Deposit (50%)',
  'Deposit link sent', 'Deposit paid', 'Balance paid'
];
var DAYS = ['Thursday, December 17', 'Tuesday, December 22', 'Either date works'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }
    ensureSummary_(ss);

    sh.appendRow([
      new Date(), clean_(d.day), clean_(d.name), clean_(d.company), clean_(d.email), clean_(d.phone),
      num_(d.members), num_(d.guests), num_(d.infants), clean_(d.childrenAges), clean_(d.pickup),
      clean_(d.dietary), clean_(d.upgrades), clean_(d.notes), num_(d.estimatedTotal), num_(d.deposit),
      '', '', ''
    ]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Inner Circle reservation: ' + d.name + ' (' + d.day + ')',
      body: [
        'New Inner Circle reservation',
        '',
        'Day: ' + d.day,
        'Name: ' + d.name + (d.company ? ' (' + d.company + ')' : ''),
        'Email: ' + d.email,
        'Mobile: ' + d.phone,
        'Party: ' + d.members + ' member(s), ' + d.guests + ' guest(s) ages 3+, ' + d.infants + ' under 3',
        "Children's ages: " + (d.childrenAges || 'none given'),
        'Pickup: ' + (d.pickup || 'none given'),
        'Dietary needs: ' + (d.dietary || 'none given'),
        'Upgrades: ' + (d.upgrades || 'none'),
        'Notes: ' + (d.notes || 'none'),
        '',
        'Estimated total: $' + num_(d.estimatedTotal).toLocaleString() + '   Deposit (50%): $' + num_(d.deposit).toLocaleString(),
        '',
        'This family was sent to their Paythen deposit page. Mark "Deposit paid" once Paythen confirms it.'
      ].join('\n')
    });

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Running totals by date, so you can see when a date reaches 10 members.
function ensureSummary_(ss) {
  if (ss.getSheetByName(SUMMARY_NAME)) return;
  var s = ss.insertSheet(SUMMARY_NAME);
  s.appendRow(['Day', 'Members', 'Guests 3+', 'Under 3', 'Estimated total', 'Deposits paid']);
  DAYS.forEach(function (day, i) {
    var r = i + 2;
    s.appendRow([
      day,
      '=SUMIF(Reservations!B:B, A' + r + ', Reservations!G:G)',
      '=SUMIF(Reservations!B:B, A' + r + ', Reservations!H:H)',
      '=SUMIF(Reservations!B:B, A' + r + ', Reservations!I:I)',
      '=SUMIF(Reservations!B:B, A' + r + ', Reservations!O:O)',
      '=COUNTIFS(Reservations!B:B, A' + r + ', Reservations!R:R, "<>")'
    ]);
  });
  s.appendRow(['All', '=SUM(B2:B4)', '=SUM(C2:C4)', '=SUM(D2:D4)', '=SUM(E2:E4)', '=SUM(F2:F4)']);
  s.getRange('A1:F1').setFontWeight('bold');
  s.getRange('E2:E5').setNumberFormat('$#,##0');
}

// Keep text from being read as a spreadsheet formula.
function clean_(v) {
  var s = (v === undefined || v === null) ? '' : String(v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function num_(v) {
  var n = Number(v);
  return isFinite(n) ? n : 0;
}
