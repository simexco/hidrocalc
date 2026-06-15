import ExcelJS from 'exceljs';
import { readFileSync } from 'fs';

const src = readFileSync('src/components/ListaMaterialesSIMEX.tsx', 'utf-8');
const wb = new ExcelJS.Workbook();

const hdrStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C3D5A' } }, alignment: { horizontal: 'center' } };
const catStyle = { font: { bold: true, color: { argb: 'FF1C3D5A' }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EFF5' } } };

function addHdr(ws, cols) { cols.forEach((c, i) => { const cell = ws.getRow(1).getCell(i + 1); cell.value = c; Object.assign(cell, hdrStyle); }); }

// Sheet 1: Kit Bridas
const ws1 = wb.addWorksheet('Kit Bridas');
ws1.columns = [{ width: 20 }, { width: 20 }, { width: 22 }, { width: 22 }, { width: 18 }, { width: 22 }, { width: 8 }];
addHdr(ws1, ['DN|Material', 'ABU SKU', 'Extremidad SKU', 'Gibault SKU', 'Empaque SKU', 'Tornillo SKU', 'Bolts']);

const kitRe = /'([^']+)':\s*\{([^}]+)\}/g;
let m;
const kitSection = src.substring(0, 12000);
while ((m = kitRe.exec(kitSection)) !== null) {
  const key = m[1], data = m[2];
  const g = (p) => { const r = data.match(new RegExp(`"${p}":\\s*"([^"]+)"`)); return r ? r[1] : ''; };
  const b = data.match(/"b":\s*(\d+)/);
  ws1.addRow([key, g('a'), g('e'), g('g'), g('em'), g('t'), b ? parseInt(b[1]) : '']);
}

// Sheet 2: Conexiones
const ws2 = wb.addWorksheet('Conexiones');
ws2.columns = [{ width: 15 }, { width: 10 }, { width: 10 }, { width: 20 }, { width: 8 }];
addHdr(ws2, ['Tipo', 'DN1', 'DN2', 'SKU', 'Bridas']);

const connRe = /\{"f":\s*"([^"]+)",\s*"d1":\s*"([^"]+)",\s*"d2":\s*"([^"]+)",\s*"sk":\s*"([^"]+)",\s*"br":\s*(\d+)\}/g;
while ((m = connRe.exec(src)) !== null) {
  ws2.addRow([m[1], m[2], m[3], m[4], parseInt(m[5])]);
}

// Sheet 3: Valvulas
const ws3 = wb.addWorksheet('Valvulas');
ws3.columns = [{ width: 40 }, { width: 8 }, { width: 20 }];
addHdr(ws3, ['Tipo', 'DN', 'SKU']);

const valvTypes = [
  ['vcg-r', 'V. Compuerta Resilente C515 Sigma Flow'],
  ['vcg-b', 'V. Compuerta Bronce C500 Sigma Flow'],
  ['vmb-c', 'V. Mariposa C504 Sigma Flow'],
  ['vmb-dex', 'V. Mariposa Doble Exc. Sigma Flow'],
  ['vmb-w', 'V. Mariposa Wafer Sigma Flow'],
];
for (const [vk, vl] of valvTypes) {
  const pat = new RegExp(`'${vk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*\\{([^}]+)\\}`);
  const vm = src.match(pat);
  if (vm) {
    const pairs = [...vm[1].matchAll(/'([^']+)':\s*"([^"]+)"/g)];
    for (const p of pairs) ws3.addRow([vl, p[1], p[2]]);
  }
}

// Sheet 4: Tapas y Carretes
const ws4 = wb.addWorksheet('Tapas y Carretes');
ws4.columns = [{ width: 30 }, { width: 8 }, { width: 20 }];
addHdr(ws4, ['Tipo', 'DN', 'SKU']);

const tapaRe = /"([^"]+)":\s*"(CI-BCF-[^"]+)"/g;
while ((m = tapaRe.exec(src)) !== null) ws4.addRow(['Tapa Ciega HD Sigma', m[1], m[2]]);

const cdmRe = /'([^']+)':\s*"(CI-CDM-[^"]+)"/g;
while ((m = cdmRe.exec(src)) !== null) ws4.addRow(['Carrete de Desmontaje Sigma Flow', m[1], m[2]]);

// Sheet 5: Checks
const ws5 = wb.addWorksheet('Checks');
ws5.columns = [{ width: 40 }, { width: 8 }, { width: 20 }];
addHdr(ws5, ['Tipo', 'DN', 'SKU']);

for (const [d, dn] of [['2','2'],['2.5','2½'],['3','3'],['4','4'],['6','6'],['8','8'],['10','10'],['12','12'],['14','14'],['16','16']]) ws5.addRow(['Check Resilente C508 Sigma Flow', dn+'"', `VI-CHK-R${d}`]);
for (const d of ['18','20','24','30','36']) ws5.addRow(['Check Compuerta Bronce Sigma Flow', d+'"', `VI-CHK-${d}`]);
for (const [d, dn] of [['2','2'],['2.5','2½'],['3','3'],['4','4'],['6','6'],['8','8'],['10','10'],['12','12']]) ws5.addRow(['Duo Check Wafer Sigma Flow', dn+'"', `VI-DCK-${d}`]);

// Sheet 6: ABU Descripciones
const ws6 = wb.addWorksheet('ABU Descripciones');
ws6.columns = [{ width: 22 }, { width: 65 }];
addHdr(ws6, ['SKU', 'Descripcion']);

const abuDesc = {
  'CI-ABU-2': 'Adaptador de Brida Universal de 2" de 59 a 72 mm Sigma Flow',
  'CI-ABU-24860': 'Adaptador de Brida Universal de 2" de 48 a 60 mm Sigma Flow',
  'CI-ABU-257285': 'Adaptador de Brida Universal de 2.5" de 72 a 85 mm Sigma Flow',
  'CI-ABU-3': 'Adaptador de Brida Universal de 3" de 88 a 103 mm Sigma Flow',
  'CI-ABU-496116': 'Adaptador de Brida Universal de 4" de 96 a 116 mm Sigma Flow',
  'CI-ABU-4109130': 'Adaptador de Brida Universal de 4" de 109 a 130 mm Sigma Flow',
  'CI-ABU-4107135': 'Adaptador de Brida Universal de 4" de 107 a 135 mm Sigma Flow',
  'CI-ABU-6159184': 'Adaptador de Brida Universal de 6" de 159 a 184 mm Sigma Flow',
  'CI-ABU-8I': 'Adaptador de Brida Universal de 8" Ingles Sigma Flow',
  'CI-ABU-8M': 'Adaptador de Brida Universal de 8" Metrico Sigma Flow',
  'CI-ABU-8214249': 'Adaptador de Brida Universal de 8" de 214 a 249 mm Sigma Flow',
  'CI-ABU-10AC': 'Adaptador de Brida Universal de 10" de 272 a 289 mm Sigma Flow',
  'CI-ABU-10272308': 'Adaptador de Brida Universal de 10" de 272 a 308 mm Sigma Flow',
  'CI-ABU-10245267': 'Adaptador de Brida Universal de 10" de 245 a 267 mm Sigma Flow',
  'CI-ABU-12': 'Adaptador de Brida Universal de 12" de 315 a 332 mm Sigma Flow',
  'CI-ABU-12322342': 'Adaptador de Brida Universal de 12" de 322 a 342 mm Sigma Flow',
  'CI-ABU-12324365': 'Adaptador de Brida Universal de 12" de 324 a 365 mm Sigma Flow',
  'CI-ABU-14': 'Adaptador de Brida Universal de 14" de 351 a 378 mm Sigma Flow',
  'CI-ABU-14374391': 'Adaptador de Brida Universal de 14" de 374 a 391 mm Sigma Flow',
  'CI-ABU-16': 'Adaptador de Brida Universal de 16" de 390 a 410 mm Sigma Flow',
  'CI-ABU-16425442': 'Adaptador de Brida Universal de 16" de 425 a 442 mm Sigma Flow',
  'CI-ABU-16390435': 'Adaptador de Brida Universal de 16" de 390 a 435 mm Sigma Flow',
  'CI-ABU-18445472': 'Adaptador de Brida Universal de 18" de 445 a 472 mm Sigma Flow',
  'CI-ABU-18480510': 'Adaptador de Brida Universal de 18" de 480 a 510 mm Sigma Flow',
  'CI-ABU-20500532': 'Adaptador de Brida Universal de 20" de 500 a 532 mm Sigma Flow',
  'CI-ABU-20527544': 'Adaptador de Brida Universal de 20" de 527 a 544 mm Sigma Flow',
  'CI-ABU-24': 'Adaptador de Brida Universal de 24" de 608 a 636 mm Sigma Flow',
  'CI-ABU-24645680': 'Adaptador de Brida Universal de 24" de 645 a 680 mm Sigma Flow',
  'CI-ABP-EAD3': 'Adaptador de Brida Universal de 3" PEAD Sigma Flow',
  'CI-ABP-EAD4': 'Adaptador de Brida Universal de 4" PEAD Sigma Flow',
  'CI-ABP-EAD6': 'Adaptador de Brida Universal de 6" PEAD Sigma Flow',
  'CI-ABP-EAD8': 'Adaptador de Brida Universal de 8" PEAD Sigma Flow',
  'CI-ABP-EAD10': 'Adaptador de Brida Universal de 10" PEAD Sigma Flow',
  'CI-ABP-EAD12': 'Adaptador de Brida Universal de 12" PEAD Sigma Flow',
};
for (const [sku, desc] of Object.entries(abuDesc)) ws6.addRow([sku, desc]);

// Sheet 7: Tornillos
const ws7 = wb.addWorksheet('Tornillos');
ws7.columns = [{ width: 22 }, { width: 35 }];
addHdr(ws7, ['SKU', 'Descripcion']);

const torDesc = {
  'DN-TOR-5/821/2': 'Tornillo 5/8" x 2-1/2"',
  'DN-TOR-5/83': 'Tornillo 5/8" x 3"',
  'DN-TOR-3/431/2': 'Tornillo 3/4" x 3-1/2"',
  'DN-TOR-7/84': 'Tornillo 7/8" x 4"',
  'DN-TOR-141/2': 'Tornillo 1" x 4-1/2"',
  'DN-TOR-11/85': 'Tornillo 1-1/8" x 5"',
  'DN-TOR-11/451/2': 'Tornillo 1-1/4" x 5-1/2"',
  'DN-TOR-11/46': 'Tornillo 1-1/4" x 6"',
  'DN-TOR-11/27': 'Tornillo 1-1/2" x 7"',
};
for (const [sku, desc] of Object.entries(torDesc)) ws7.addRow([sku, desc]);

// Sheet 8: Empaques
const ws8 = wb.addWorksheet('Empaques');
ws8.columns = [{ width: 18 }, { width: 45 }];
addHdr(ws8, ['SKU', 'Descripcion']);

const empRe = /"em":\s*"([^"]+)"/g;
const empSet = new Set();
while ((m = empRe.exec(src)) !== null) empSet.add(m[1]);
for (const sku of [...empSet].sort()) {
  const dn = sku.replace('JI-ENE-', '').replace('JN-ENE-', '');
  ws8.addRow([sku, `Empaque SBR ${dn}" Sigma Flow`]);
}

const out = 'Catalogo_SIMEX_HidroCalc.xlsx';
await wb.xlsx.writeFile(out);
console.log('OK:', out);
