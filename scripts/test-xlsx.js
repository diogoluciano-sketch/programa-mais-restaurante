import fs from 'fs';
import xlsx from 'xlsx';

const dir = './planilha-cardapio';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
if (files.length === 0) {
  console.log("No files found");
  process.exit(1);
}

const workbook = xlsx.readFile(dir + '/' + files[0]);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
console.log(JSON.stringify(jsonData.slice(0, 10), null, 2));
