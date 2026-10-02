import { parseGenericDate } from "../profiles/generic";
import { sniffColumns, createGenericAutoProfile } from "../profiles/generic-auto";
import { parseKudaDate, kudaProfile } from "../profiles/kuda";
import { parseOpayDate, opayProfile } from "../profiles/opay";
import { parsePalmPayDate, palmpayProfile } from "../profiles/palmpay";
import { parseSterlingDate, sterlingProfile } from "../profiles/sterling";
import { validateHeaders, normalizeRows } from "../normalize";
import { suggestCategoryAndType } from "../suggest";
import { parseStatementCsv } from "../parse";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log("Running Phase 2 verification checks...");

// 1. Check date parsing strictly returns null on invalid dates, never defaults to today
assert(parseKudaDate("14/06/26 10:30:00") === "2026-06-14", "Kuda valid date");
assert(parseKudaDate("invalid-date") === null, "Kuda invalid date returns null");
assert(parseKudaDate("") === null, "Kuda empty date returns null");
assert(parseKudaDate("32/01/2026") === null, "Kuda out of range day returns null");

assert(parseOpayDate("04 Jan 2026 21:57:28") === "2026-01-04", "OPay valid date");
assert(parseOpayDate("corrupt date string") === null, "OPay corrupt date returns null");
assert(parseOpayDate("") === null, "OPay empty returns null");

assert(parsePalmPayDate("2026-06-18 12:00:00") === "2026-06-18", "PalmPay valid date");
assert(parsePalmPayDate("not a date") === null, "PalmPay invalid returns null");

assert(parseSterlingDate("25-06-2026") === "2026-06-25", "Sterling valid date");
assert(parseSterlingDate("broken") === null, "Sterling invalid returns null");

assert(parseGenericDate("2026-07-01") === "2026-07-01", "Generic ISO date");
assert(parseGenericDate("01/07/2026") === "2026-07-01", "Generic slash date");
assert(parseGenericDate("bad-input") === null, "Generic bad returns null");

// 2. Header validation
const goodKudaHeaders = ["Date/Time", "Money In", "Money Out", "Category", "To/From", "Description", "Balance"];
const badKudaHeaders = ["Transaction Date", "Vendor", "Total Amount"];
assert(validateHeaders(goodKudaHeaders, kudaProfile).valid === true, "Kuda headers valid");
const badVal = validateHeaders(badKudaHeaders, kudaProfile);
assert(badVal.valid === false, "Kuda headers invalid recognized");
assert(badVal.error?.includes("This doesn't look like a Kuda Bank statement") === true, "Error message formatting");

// 3. Normalization (stripping ₦, commas, dr/cr, dateError flag)
const rawKudaRows = [
  {
    "Date/Time": "14/06/26 10:30:00",
    "Money In": "₦50,000.00",
    "Money Out": "0",
    "Description": "Salary payment",
  },
  {
    "Date/Time": "invalid-date",
    "Money In": "0",
    "Money Out": "₦3,500.50",
    "Description": "ATM wdrw Victoria Island",
  },
];

const normalized = normalizeRows(rawKudaRows, kudaProfile);
assert(normalized.length === 2, "Normalized length is 2");
assert(normalized[0]!.amount === 50000, "₦ and comma stripped from Money In");
assert(normalized[0]!.drCr === "cr", "Money in mapped to cr");
assert(normalized[0]!.dateError === false, "Valid date not flagged as error");
assert(typeof normalized[0]!.uuid === "string" && normalized[0]!.uuid.length > 10, "UUID generated");

assert(normalized[1]!.amount === 3500.5, "₦ and comma stripped from Money Out");
assert(normalized[1]!.drCr === "dr", "Money out mapped to dr");
assert(normalized[1]!.dateError === true, "Invalid date flagged as dateError");

// 4. Suggestions
const s1 = suggestCategoryAndType("Stamp duty on electronic funds transfer");
assert(s1.categoryName === "Bank Charges" && s1.type === "expense", "Stamp duty rule");

const s2 = suggestCategoryAndType("VAT on transaction charge");
assert(s2.categoryName === "Bank Charges" && s2.type === "expense", "VAT rule");

const s3 = suggestCategoryAndType("ATM wdrw self");
assert(s3.type === "transfer" && s3.transferTarget === "cash", "Cash withdrawal rule");

const s4 = suggestCategoryAndType("Monthly Tithe offering payment");
assert(s4.categoryName === "Tithe" && s4.type === "expense", "Tithe rule");

// 5. Generic-Auto sniffing and profile creation
const unknownHeaders = ["Post Date", "Narration", "Debit", "Credit", "Ref Number"];
const sampleData = [
  { "Post Date": "15/07/2026", "Narration": "Transfer to John", "Debit": "₦4,500.00", "Credit": "", "Ref Number": "TX1001" },
  { "Post Date": "16/07/2026", "Narration": "Payment received", "Debit": "", "Credit": "₦20,000.00", "Ref Number": "TX1002" },
];
const sniffed = sniffColumns(unknownHeaders, sampleData);
assert(sniffed.columnMap.date === "Post Date", "Sniffed Post Date correctly");
assert(sniffed.columnMap.description === "Narration", "Sniffed Narration correctly");
assert(sniffed.columnMap.moneyIn === "Credit", "Sniffed Credit correctly");
assert(sniffed.columnMap.moneyOut === "Debit", "Sniffed Debit correctly");
assert(sniffed.suggestedDateFormat === "DD/MM/YYYY", "Sniffed DD/MM/YYYY date format correctly");

const autoProf = createGenericAutoProfile(sniffed.columnMap, "DD/MM/YYYY");
assert(autoProf.parseDate("15/07/2026") === "2026-07-15", "Auto profile parses date accurately");
assert(autoProf.parseDate("invalid") === null, "Auto profile returns null on invalid date, never today");

// 6. Full parseStatementCsv test
const csvContent = `Date,Description,Amount,Type\n2026-06-01,Tithe,₦10,000.00,Dr\n2026-06-02,ATM WDRW,₦5,000,Dr\nbad-date,VAT fee,₦50,Dr\n`;

parseStatementCsv(csvContent, {
  name: "Generic CSV",
  expectedHeaders: ["Date", "Description", "Amount", "Type"],
  columnMap: { date: "Date", description: "Description", amount: "Amount", drCr: "Type" },
  dateFormat: "YYYY-MM-DD",
  parseDate: parseGenericDate,
}).then((res) => {
  assert(res.totalCount === 3, "Parsed 3 rows");
  assert(res.dateErrorCount === 1, "1 date error identified");
  assert(res.rows[0]!.suggestedCategory === "Tithe", "Row 0 suggested Tithe");
  assert(res.rows[1]!.suggestedType === "transfer", "Row 1 suggested transfer");
  assert(res.rows[2]!.dateError === true, "Row 2 dateError set");
  console.log("All Phase 2 verification checks PASSED successfully!");
}).catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
