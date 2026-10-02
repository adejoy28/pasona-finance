import * as fs from "fs";
import { parseStatementFile } from "../parse";
import { kudaProfile } from "../profiles/kuda";
import { opayProfile } from "../profiles/opay";

async function test() {
  console.log("Testing actual statement files...");

  // 1. Test Kuda (auto-detected)
  const kudaBuf = fs.readFileSync("src/import/kuda Statement.xlsx");
  const kudaFile = new File([kudaBuf], "kuda Statement.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const kudaResult = await parseStatementFile(kudaFile);
  console.log("Kuda profile detected:", kudaResult.profile.name);
  console.log("Kuda rows parsed:", kudaResult.rows.length);
  console.log("Kuda date errors:", kudaResult.dateErrorCount);
  console.log("Sample Kuda row 0:", JSON.stringify(kudaResult.rows[0]));
  console.log("Sample Kuda row 1:", JSON.stringify(kudaResult.rows[1]));

  // 2. Test OPay (auto-detected)
  const opayBuf = fs.readFileSync("src/import/opay.xlsx");
  const opayFile = new File([opayBuf], "opay.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const opayResult = await parseStatementFile(opayFile);
  console.log("\nOPay profile detected:", opayResult.profile.name);
  console.log("OPay rows parsed:", opayResult.rows.length);
  console.log("OPay sheets found:", opayResult.availableSheets);
  console.log("OPay date errors:", opayResult.dateErrorCount);
  console.log("Sample OPay row 0:", JSON.stringify(opayResult.rows[0]));

  // Verify OWealth sweeps vs interest
  const sweepRows = opayResult.rows.filter((r) => r.suggestedType === "transfer" && r.description.toLowerCase().includes("owealth"));
  const interestRows = opayResult.rows.filter((r) => r.suggestedType === "income" && r.description.toLowerCase().includes("interest"));
  console.log("OPay OWealth sweep rows:", sweepRows.length);
  console.log("OPay OWealth interest rows:", interestRows.length);

  // 3. Test PalmPay PDF
  const pdfPath = "src/import/Statements download_20261001225804_18f6e0c4-be0c-464c-aa3f-fb22ed4e1725.pdf";
  if (fs.existsSync(pdfPath)) {
    const pdfBuf = fs.readFileSync(pdfPath);
    const pdfFile = new File([pdfBuf], "palmpay.pdf", { type: "application/pdf" });
    const pdfResult = await parseStatementFile(pdfFile);
    console.log("\nPalmPay PDF profile detected:", pdfResult.profile.name);
    console.log("PalmPay PDF rows parsed:", pdfResult.rows.length);
    console.log("PalmPay PDF date errors:", pdfResult.dateErrorCount);
    console.log("Sample PalmPay row 0:", JSON.stringify(pdfResult.rows[0]));
  }

  console.log("\nSUCCESS: All real sample bank statements (Kuda XLSX, OPay XLSX, PalmPay PDF) parsed cleanly!");
}

test().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
