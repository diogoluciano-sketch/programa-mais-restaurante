import fs from 'fs';
import xlsx from 'xlsx';
import path from 'path';

const dir = './planilha-cardapio';
if (!fs.existsSync(dir)) {
    console.error(`Directory ${dir} does not exist`);
    process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));

if (files.length === 0) {
    console.error("No .xlsx files found in the directory");
    process.exit(1);
}

const filePath = path.join(dir, files[0]);
console.log(`Reading file: ${filePath}`);

const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

// Print rows with index to help mapping
jsonData.slice(0, 30).forEach((row, index) => {
    console.log(`Row ${index}:`, JSON.stringify(row));
});
