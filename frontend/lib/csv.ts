const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function firstCell(line: string): string {
  return (line.split(",")[0] ?? "").trim().replace(/^"|"$/g, "");
}

// Reads recipient emails from the first column of a CSV file. Accepts either
// a bare list of addresses or a file with a header row (auto-detected: if
// the first line's first cell isn't a valid email, it's skipped as a header).
export function parseRecipientsFromCsv(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const startIndex = EMAIL_PATTERN.test(firstCell(lines[0]!)) ? 0 : 1;
  const recipients: string[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cell = firstCell(lines[i]!);
    if (EMAIL_PATTERN.test(cell)) {
      recipients.push(cell);
    }
  }

  return [...new Set(recipients)];
}
