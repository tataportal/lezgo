// ============================================
// PEGA ESTO EN: Google Sheets → Extensiones → Apps Script
// ============================================

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([data.email, new Date().toISOString()]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// DESPUÉS DE PEGAR:
// 1. Click en "Implementar" → "Nueva implementación"
// 2. Tipo: "Aplicación web"
// 3. Ejecutar como: "Yo" (tu cuenta)
// 4. Acceso: "Cualquier persona"
// 5. Click en "Implementar"
// 6. Copia la URL que te da
// 7. Pega esa URL en index.html donde dice TU_URL_DE_APPS_SCRIPT
