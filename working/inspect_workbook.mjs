import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = "C:/Users/SSAFY/Desktop/first_in_wireframe/working/요구사항_정의서.xlsm";
const previewDir = "C:/Users/SSAFY/Desktop/first_in_wireframe/tmp/workbook_preview";
await fs.mkdir(previewDir, { recursive: true });

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const overview = await workbook.inspect({
  kind: "workbook,sheet,table,region,definedName,drawing",
  maxChars: 16000,
  tableMaxRows: 60,
  tableMaxCols: 20,
  tableMaxCellChars: 240,
});
console.log("OVERVIEW\n" + overview.ndjson);

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  const rangeAddress = used?.address ?? "A1";
  console.log(`SHEET ${sheet.name} USED ${rangeAddress}`);
  await fs.writeFile(`${previewDir}/${sheet.name}_values.json`, JSON.stringify(used.values, null, 2), "utf8");
  const details = await workbook.inspect({
    kind: "formula,computedStyle",
    sheetId: sheet.name,
    range: rangeAddress,
    maxChars: 9000,
    tableMaxRows: 120,
    tableMaxCols: 30,
    tableMaxCellChars: 400,
    options: { maxResults: 300 },
  });
  console.log(details.ndjson);
  for (let start = 1; start <= 283; start += 50) {
    const end = Math.min(283, start + 49);
    const preview = await workbook.render({
      sheetName: sheet.name,
      range: `A${start}:J${end}`,
      scale: 1,
      format: "png",
    });
    await fs.writeFile(`${previewDir}/${sheet.name.replace(/[\\/:*?\"<>|]/g, "_")}_${start}-${end}.png`, new Uint8Array(await preview.arrayBuffer()));
  }
}
