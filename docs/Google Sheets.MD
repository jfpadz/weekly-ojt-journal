# How to setup Google sheet automation

1.  Go to Extensions > Apps Script.

2. Paste the code below.

3. Deploy: Click Deploy > Manage Deployments > Edit (Pencil) > New Version > Deploy.
"""
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); 

  var debugLogs = [];
  var foundRow = -1;

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Parse target: "2026-01-30" -> Year 2026, Month 0 (Jan), Day 30
    var parts = data.dateKey.split('-');
    var targetYear = parseInt(parts[0], 10);
    var targetMonth = parseInt(parts[1], 10) - 1; 
    var targetDay = parseInt(parts[2], 10);

    debugLogs.push("Looking for: " + (targetMonth+1) + "/" + targetDay + "/" + targetYear);

    var dateRange = sheet.getRange("B:B").getValues();

    for (var i = 0; i < dateRange.length; i++) {
      var cellVal = dateRange[i][0];
      var y = null, m = null, d = null;

      // CASE 1: It is a real Date Object (Blue calendar icon in Sheets)
      if (cellVal instanceof Date) {
        y = cellVal.getFullYear();
        m = cellVal.getMonth();
        d = cellVal.getDate();
      } 
      // CASE 2: It is Text (e.g. "1/30/2026")
      else if (typeof cellVal === 'string') {
        // Try splitting by slash
        var dateParts = cellVal.split('/');
        if (dateParts.length === 3) {
          // Assuming M/D/YYYY format (common in US/Philippines)
          // "1/30/2026" -> [1, 30, 2026]
          m = parseInt(dateParts[0], 10) - 1;
          d = parseInt(dateParts[1], 10);
          y = parseInt(dateParts[2], 10);
        }
      }

      // Log first 5 rows to see what we found
      if (i < 5) {
         debugLogs.push("Row " + (i+1) + " (" + typeof cellVal + "): " + cellVal + " -> Parsed: " + (m+1) + "/" + d + "/" + y);
      }

      // Match check
      if (y === targetYear && m === targetMonth && d === targetDay) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 3, 1, 6).setValues([[
        data.amIn, data.amOut, data.pmIn, data.pmOut, data.activity, data.accomplished
      ]]);
      return ContentService.createTextOutput(JSON.stringify({
        "result": "success", 
        "row": foundRow,
        "logs": debugLogs
      }));
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      "result": "not_found", 
      "logs": debugLogs
    }));

  } catch(f) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": f.toString(), "logs": debugLogs}));
  } finally {
    lock.releaseLock();
  }
}
"""