import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePdfStatement } from "../pdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, "../Statements download_20261001225804_18f6e0c4-be0c-464c-aa3f-fb22ed4e1725.pdf");

async function run() {
  console.log("Testing PalmPay PDF parser on real file...");
  const buf = fs.readFileSync(pdfPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  
  const result = await parsePdfStatement(arrayBuffer);
  console.log("Total parsed rows:", result.totalCount);
  console.log("Headers:", result.headers);
  console.log("Profile:", result.profile.name);
  console.log("First 3 rows:");
  console.log(result.rows.slice(0, 3));
  console.log("Last 2 rows:");
  console.log(result.rows.slice(-2));

  if (result.totalCount > 100) {
    console.log("\nSUCCESS: PalmPay PDF parsed cleanly with", result.totalCount, "transactions!");
  } else {
    throw new Error(`Expected >100 transactions, got ${result.totalCount}`);
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
