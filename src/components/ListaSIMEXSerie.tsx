'use client'

// ═══ SIMEX Materials for Tuberías en Serie ═══
// Reads accessories from the existing K/Le fittings system
// and generates SIMEX SKU list automatically — NO duplicate input

const DN_MM: Record<number,string> = {50:'2"',75:'3"',100:'4"',150:'6"',200:'8"',250:'10"',300:'12"',350:'14"',400:'16"',450:'18"',500:'20"',600:'24"',750:'30"',900:'36"'}

const MAT_MAP: Record<string,string> = {
  'PVC — AWWA C900/C905':'PVC AWWA C900','PVC — Métrico ISO 4422':'PVC Métrico',
  'PVC — Ingles ASTM D2241':'PVC Inglés','HDPE — AWWA C906':'PEAD',
  'Hierro dúctil':'HD AWWA','Acero nuevo':'Acero','Acero (10+ años)':'Acero',
}

// Mapping from fitting type keywords → SIMEX search params
// Uses includes() matching so accents and exact wording don't matter
const FITTING_MAP: Array<{ match: string; search: string; bridas: number }> = [
  { match: 'codo 90', search: 'codo-90', bridas: 2 },
  { match: 'codo 45', search: 'codo-45', bridas: 2 },
  { match: 'codo 22', search: 'codo-22', bridas: 2 },
  { match: 'tee paso', search: 'tee', bridas: 3 },
  { match: 'tee deriv', search: 'tee', bridas: 3 },
  { match: 'tee', search: 'tee', bridas: 3 },
  { match: 'compuerta', search: 'vcg', bridas: 2 },
  { match: 'mariposa', search: 'vmb', bridas: 2 },
  { match: 'check', search: 'check', bridas: 2 },
  { match: 'retenci', search: 'check', bridas: 2 },
  { match: 'reducci', search: 'red', bridas: 2 },
  { match: 'medidor', search: 'medidor', bridas: 2 },
  { match: 'aire', search: 'aire', bridas: 0 },
]

// Minimal KIT data for brida calculation (same as ListaMaterialesSIMEX)
const KIT: Record<string,{a?:string,e?:string,eo?:number,g?:string,em?:string,t?:string,b?:number}> = {
  '4"|PVC AWWA C900': {a:"CI-ABU-4109130",e:"CN-EXT-4120",em:"JI-ENE-4",t:"DN-TOR-5/83",b:8},
  '4"|HD AWWA': {a:"CI-ABU-4109130",e:"CN-EXT-4120",em:"JI-ENE-4",t:"DN-TOR-5/83",b:8},
  '6"|PVC AWWA C900': {a:"CI-ABU-6159184",e:"CN-EXT-6175",em:"JI-ENE-6",t:"DN-TOR-3/431/2",b:8},
  '6"|HD AWWA': {a:"CI-ABU-6159184",e:"CN-EXT-6175",em:"JI-ENE-6",t:"DN-TOR-3/431/2",b:8},
  '8"|PVC AWWA C900': {a:"CI-ABU-8I",e:"CN-EXT-8230",em:"JI-ENE-8",t:"DN-TOR-3/431/2",b:8},
  '8"|HD AWWA': {a:"CI-ABU-8I",e:"CN-EXT-8230",em:"JI-ENE-8",t:"DN-TOR-3/431/2",b:8},
  '8"|Acero': {a:"CI-ABU-8I",e:"CN-EXT-8219",em:"JI-ENE-8",t:"DN-TOR-3/431/2",b:8},
  '10"|PVC AWWA C900': {a:"CI-ABU-10AC",e:"CN-EXT-10280",em:"JI-ENE-10",t:"DN-TOR-7/84",b:12},
  '10"|HD AWWA': {a:"CI-ABU-10AC",e:"CN-EXT-10280",em:"JI-ENE-10",t:"DN-TOR-7/84",b:12},
  '12"|PVC AWWA C900': {a:"CI-ABU-12322342",e:"CN-EXT-12335",em:"JI-ENE-12",t:"DN-TOR-7/84",b:12},
  '12"|HD AWWA': {a:"CI-ABU-12322342",e:"CN-EXT-12335",em:"JI-ENE-12",t:"DN-TOR-7/84",b:12},
}

// Connection SKUs
const CONN: Record<string,Record<string,string>> = {
  'codo-90': {'4"':'CI-CFB-490','6"':'CI-CFB-690','8"':'CI-CFB-890','10"':'CI-CFB-1090','12"':'CI-CFB-1290'},
  'codo-45': {'4"':'CI-CFB-445','6"':'CI-CFB-645','8"':'CI-CFB-845','10"':'CI-CFB-1045','12"':'CI-CFB-1245'},
  'codo-22': {'4"':'CI-CFB-422','6"':'CI-CFB-622','8"':'CI-CFB-822','10"':'CI-CFB-1022','12"':'CI-CFB-1222'},
}
const VALV: Record<string,Record<string,string>> = {
  'vcg': {'4"':'VI-VFF-4','6"':'VI-VFF-6','8"':'VI-VFF-8','10"':'VI-VFF-10','12"':'VI-VFF-12'},
  'vmb': {'4"':'VI-VMC-4250','6"':'VI-VMC-6250','8"':'VI-VMC-8250','10"':'VI-VMC-10250','12"':'VI-VMC-12250'},
  'check': {'4"':'VI-CHK-R4','6"':'VI-CHK-R6','8"':'VI-CHK-R8','10"':'VI-CHK-R10','12"':'VI-CHK-R12'},
}
const TEE: Record<string,string> = {'4"':'CI-CFT-44','6"':'CI-CFT-66','8"':'CI-CFT-88','10"':'CI-CFT-1010','12"':'CI-CFT-1212'}

interface Tramo { id: string; name: string; DN: number|null; C: number; fittings?: {type:string;k:number;qty:number}[] }
interface Mat { name: string; c: number }
interface Item { sku:string; desc:string; qty:number; norma:string }

interface Props { tramos: Tramo[]; materials: Mat[] }

export default function ListaSIMEXSerie({ tramos, materials }: Props) {
  // Build materials per tramo
  const tramoItems: { name:string; dn:string; items:Item[] }[] = []

  for (const t of tramos) {
    if (!t.DN || !t.fittings || t.fittings.length === 0) continue
    const dn = DN_MM[t.DN] || ''
    if (!dn) continue
    const matName = materials.find(m => m.c === t.C)?.name || ''
    const matCat = MAT_MAP[matName] || matName
    const kitKey = `${dn}|${matCat}`
    const kit = KIT[kitKey]

    const items: Item[] = []
    let totalBridas = 0

    for (const f of t.fittings) {
      // Find matching SIMEX mapping using case-insensitive includes
      const fLower = f.type.toLowerCase()
      const map = FITTING_MAP.find(m => fLower.includes(m.match))
      if (!map) continue

      // Get SKU
      let sku = ''
      let desc = ''
      if (map.search.startsWith('codo')) {
        sku = CONN[map.search]?.[dn] || ''
        desc = `Codo HD ${dn}×${map.search === 'codo-90' ? '90°' : map.search === 'codo-45' ? '45°' : '22°'}`
      } else if (map.search === 'tee') {
        sku = TEE[dn] || ''
        desc = `Tee HD ${dn}×${dn}`
      } else if (map.search === 'vcg') {
        sku = VALV.vcg[dn] || ''
        desc = `V. Compuerta Resilente ${dn}`
      } else if (map.search === 'vmb') {
        sku = VALV.vmb[dn] || ''
        desc = `V. Mariposa C504 ${dn}`
      } else if (map.search === 'check') {
        sku = VALV.check[dn] || ''
        desc = `Check Resilente ${dn}`
      } else if (map.search === 'red') {
        desc = `Reducción ${dn}`
        sku = '← CONF'
      }

      if (sku || desc) {
        items.push({ sku: sku || '← CONF', desc, qty: f.qty, norma: 'AWWA' })
        totalBridas += map.bridas * f.qty
      }
    }

    // Add brida kit
    if (kit && totalBridas > 0) {
      if (kit.a) items.push({ sku: kit.a, desc: `Adaptador Bridado Universal ${dn}`, qty: totalBridas, norma: 'EN 14525' })
      if (kit.em) items.push({ sku: kit.em, desc: `Empaque DN ${dn}`, qty: totalBridas, norma: '—' })
      if (kit.t) items.push({ sku: kit.t, desc: `Tornillo DN ${dn}`, qty: totalBridas * (kit.b || 8), norma: '—' })
    }

    if (items.length > 0) {
      tramoItems.push({ name: t.name || `Tramo`, dn, items })
    }
  }

  if (tramoItems.length === 0) return null

  // Consolidate all items
  const consolidated: Record<string, Item> = {}
  tramoItems.flatMap(t => t.items).forEach(item => {
    if (!consolidated[item.sku]) consolidated[item.sku] = { ...item, qty: 0 }
    consolidated[item.sku].qty += item.qty
  })
  const allItems = Object.values(consolidated).sort((a, b) => a.sku.localeCompare(b.sku))

  return (
    <div className="mt-6 pt-5 border-t-2 border-[#1C3D5A]/20 space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold text-[#1C3D5A] dark:text-blue-300">Lista de materiales SIMEX para esta línea</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Generada automáticamente desde los accesorios de cada tramo</p>
      </div>

      {/* Per-tramo breakdown */}
      {tramoItems.map((t, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-[#1C3D5A] px-4 py-2 text-[10px] font-semibold text-white uppercase tracking-wider">
            {t.name} — DN {t.dn}
          </div>
          {t.items.map((item, j) => (
            <div key={j} className={`flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-700 text-xs ${item.sku.startsWith('CI-ABU') || item.sku.startsWith('JI-') || item.sku.startsWith('DN-TOR') ? 'bg-gray-50/50 text-gray-500' : ''}`}>
              <span className="font-mono text-[#1C3D5A] dark:text-blue-300 w-32 shrink-0">{item.sku}</span>
              <span className="flex-1 text-gray-700 dark:text-gray-300">{item.desc}</span>
              <span className="font-semibold w-10 text-center">×{item.qty}</span>
              <span className="text-[10px] text-gray-400 w-16 text-right">{item.norma}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Consolidated total */}
      {tramoItems.length > 1 && (
        <div className="rounded-xl border-2 border-[#1C3D5A]/30 overflow-hidden">
          <div className="bg-[#1C3D5A] px-4 py-2.5 text-xs font-semibold text-white uppercase tracking-wider">
            Total consolidado — {allItems.length} SKUs distintos
          </div>
          {allItems.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2 border-b border-gray-100 text-xs ${i % 2 ? 'bg-gray-50/30' : ''}`}>
              <span className="font-mono text-[#1C3D5A] w-32 shrink-0">{item.sku}</span>
              <span className="flex-1 text-gray-600">{item.desc}</span>
              <span className="font-bold w-10 text-center">×{item.qty}</span>
              <span className="text-[10px] text-gray-400 w-16 text-right">{item.norma}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-[#1C3D5A] text-white text-xs font-medium hover:bg-[#0F2438] transition-colors shadow-sm">Generar PDF para distribuidor</button>
        <button onClick={() => {
          const lines = ['SKU\tDescripción\tCantidad'];
          allItems.forEach(i => lines.push(`${i.sku}\t${i.desc}\t${i.qty}`));
          navigator.clipboard.writeText(lines.join('\n')).then(() => alert('Lista copiada'));
        }} className="px-4 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors">Copiar SKUs</button>
      </div>

      <p className="text-[9px] text-gray-400 pt-2 border-t border-gray-100">
        Contacte a su distribuidor SIMEX autorizado · simexco.com.mx
      </p>
    </div>
  )
}
