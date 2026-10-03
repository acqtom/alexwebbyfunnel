/**
 * Receives sign-ups and survey answers from the funnel pages and adds them as rows.
 *
 * Setup:
 *   1. Create a Google Sheet, then Extensions → Apps Script.
 *   2. Replace everything in Code.gs with this file and click Save.
 *   3. Deploy → New deployment → type "Web app".
 *        Execute as: Me    Who has access: Anyone
 *   4. Authorise when asked, copy the Web app URL (ends in /exec)
 *      and paste it into SHEET_URL in assets/sheet.js.
 *
 * Tabs ("Registrations", "Survey") and their column headers are created
 * automatically. New fields get a new column added on the right.
 */

const ALLOWED_SHEETS = ["Registrations", "Survey"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (ALLOWED_SHEETS.indexOf(body.sheet) === -1) return reply({ ok: false, error: "unknown sheet" });

    const row = Object.assign({ Timestamp: new Date() }, body.data);
    appendRow(getSheet(body.sheet), row);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// Writes values under matching headers, adding a header for any new field
function appendRow(sheet, row) {
  const lastCol = sheet.getLastColumn();
  const headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

  Object.keys(row).forEach(key => {
    if (headers.indexOf(key) === -1) {
      headers.push(key);
      sheet.getRange(1, headers.length).setValue(key).setFontWeight("bold");
    }
  });
  if (!lastCol) sheet.setFrozenRows(1);

  const values = headers.map(h => {
    const v = row[h];
    if (v === undefined || v === null) return "";
    return Array.isArray(v) ? v.join(", ") : v;
  });
  sheet.appendRow(values);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
