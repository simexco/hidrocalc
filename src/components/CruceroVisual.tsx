"use client"

// ═══════════════════════════════════════════════════════════════
//  CRUCERO VISUAL — armado guiado con símbolos de plano
//  El ing arma el crucero pieza por pieza: cada brida libre muestra
//  un botón + para conectar la siguiente pieza. Las bridas libres
//  van "a tubería" (con adaptador); las uniones entre piezas solo
//  llevan empaque + tornillos. De aquí se deriva la lista SIMEX.
//  Los codos desvían el trazo con su ángulo real (11¼°, 22½°, 45°, 90°)
//  como en la simbología normada de los planos.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { SIMEX_CAT, type SIMEXAcc, type SIMEXConex } from './ListaMaterialesSIMEX'

const { findConn, VALV, VALV_LABEL, VALV_NORMA, TAPA, CDM, DN_ORDER } = SIMEX_CAT

// ─── Tipos ──────────────────────────────────────────────────────
export interface VizNode {
  id: number
  tipo: 'valv' | 'codo' | 'tee' | 'cruz' | 'reduccion' | 'carrete' | 'tapa' | 'check' | 'vaea' | 'medidor' | 'vcontrol' | 'filtro'
  sub?: string          // valv: vcg-r|vcg-b|vmb-c · codo: 11|22|45|90 · vaea: vac|vae|vea · carrete: corto|largo|(desmontaje) · vcontrol: vrp|sost|alt
  dn: string
  dn2?: string          // tee/cruz reducida, reducción
  flip?: boolean        // voltear el lado del codo / ramal de la tee
  parentId: number | null
  parentPort: number | null
}

// Disponibilidad de válvulas de aire según catálogo SIMEX (VI-VAC / VI-VEA)
const AIRE_VAC = new Set(['2"', '3"', '4"', '6"'])
const AIRE_VEA = new Set(['2"'])
const AIRE_VAE = new Set(['2"', '3"', '4"', '6"'])

const num = (d: string) => d.replace('"', '').replace('½', '.5')
// Diámetro a 2 dígitos para SKUs de carrete: 2"→02, 6"→06, 10"→10 (CN-CAR-2506 = corto 25 de 6")
const dn2dig = (d: string) => { const n = num(d); const ent = Math.floor(parseFloat(n)); return String(ent).padStart(2, '0') + (n.includes('.5') ? '.5' : '') }
const rad = (deg: number) => (deg * Math.PI) / 180
const ANG_CODO: Record<string, number> = { '11': 11.25, '22': 22.5, '45': 45, '90': 90 }

// Puertos (bridas) de cada pieza; el puerto 0 siempre mira al padre
export function puertos(n: VizNode): { dn: string }[] {
  switch (n.tipo) {
    case 'tee':  return [{ dn: n.dn }, { dn: n.dn }, { dn: n.dn2 ?? n.dn }]
    case 'cruz': return [{ dn: n.dn }, { dn: n.dn }, { dn: n.dn2 ?? n.dn }, { dn: n.dn2 ?? n.dn }]
    case 'reduccion': return [{ dn: n.dn }, { dn: n.dn2 ?? n.dn }]
    case 'tapa': case 'vaea': return [{ dn: n.dn }]
    default: return [{ dn: n.dn }, { dn: n.dn }]  // valv, codo, carrete, check
  }
}

// ─── Derivación: grafo → piezas + uniones (motor existente) ────
export function vizToAccsConex(nodes: VizNode[]): { accs: SIMEXAcc[]; conex: SIMEXConex[] } {
  const byId = new Map(nodes.map(n => [n.id, n]))
  const accs: SIMEXAcc[] = nodes.map(n => {
    const d = n.dn, d2 = n.dn2
    switch (n.tipo) {
      case 'codo': return { id: n.id, label: `Codo ${d}×${n.sub}° Sigma`, sku: findConn('Codo', d, `${n.sub}°`)?.sk ?? `CI-CFB-${num(d)}${n.sub}`, dn: d, bridas: 2, leKey: `codo-${n.sub}`, norma: 'AWWA C110', qty: 1 }
      case 'tee': {
        const igual = !d2 || d2 === d
        return { id: n.id, label: `Tee ${d}${igual ? '' : '×' + d2} Sigma`, sku: findConn('Tee', d, igual ? d : d2!)?.sk ?? '← CONF', dn: d, dn2: igual ? undefined : d2, bridas: igual ? 3 : 2, bridas2: igual ? undefined : 1, leKey: 'tee-lateral', norma: 'AWWA C110', qty: 1 }
      }
      case 'cruz': {
        const igual = !d2 || d2 === d
        return { id: n.id, label: `Cruz ${d}${igual ? '' : '×' + d2} Sigma`, sku: findConn('Cruz', d, igual ? d : d2!)?.sk ?? '← CONF', dn: d, dn2: igual ? undefined : d2, bridas: igual ? 4 : 2, bridas2: igual ? undefined : 2, leKey: 'tee-lateral', norma: 'AWWA C110', qty: 1 }
      }
      case 'valv': return { id: n.id, label: `${VALV_LABEL[n.sub!] ?? 'Válvula'} ${d}`, sku: VALV[n.sub!]?.[d] ?? '← CONF', dn: d, bridas: 2, leKey: n.sub!, norma: VALV_NORMA[n.sub!] ?? 'AWWA', qty: 1 }
      case 'reduccion': return { id: n.id, label: `Reducción ${d}×${d2} Sigma`, sku: findConn('Redu', d, d2!)?.sk ?? '← CONF', dn: d, dn2: d2, bridas: 1, bridas2: 1, leKey: 'reduccion', norma: 'AWWA C110', qty: 1 }
      case 'carrete': {
        if (n.sub === 'corto') return { id: n.id, label: `Carrete Bridado Corto 25 cm ${d} Sigma`, sku: `CN-CAR-25${dn2dig(d)}`, dn: d, bridas: 2, leKey: 'cople', norma: 'AWWA C110', qty: 1 }
        if (n.sub === 'largo') return { id: n.id, label: `Carrete Bridado Largo 50 cm ${d} Sigma`, sku: `CN-CAR-50${dn2dig(d)}`, dn: d, bridas: 2, leKey: 'cople', norma: 'AWWA C110', qty: 1 }
        return { id: n.id, label: `Carrete de Desmontaje ${d} Sigma Flow`, sku: CDM[d] ?? '← CONF', dn: d, bridas: 2, leKey: 'cople', norma: 'AWWA', qty: 1 }
      }
      case 'medidor': return { id: n.id, label: `Medidor de Flujo (Macromedidor) ${d}`, sku: '← CONF', dn: d, bridas: 2, leKey: 'cople', norma: 'AWWA C701', qty: 1 }
      case 'vcontrol': {
        const nom = n.sub === 'sost' ? 'Válvula Sostenedora / Alivio de Presión' : n.sub === 'alt' ? 'Válvula de Altitud (control de tanque)' : 'Válvula Reductora de Presión (VRP)'
        return { id: n.id, label: `${nom} ${d} — control hidráulico`, sku: '← CONF', dn: d, bridas: 2, leKey: 'check', norma: '—', qty: 1 }
      }
      case 'filtro': return n.sub === 'canasta'
        ? { id: n.id, label: `Filtro tipo Canasta ${d} Sigma`, sku: `DI-FTC-${num(d)}`, dn: d, bridas: 2, leKey: 'cople', norma: '—', qty: 1 }
        : { id: n.id, label: `Filtro tipo Y ${d} Sigma`, sku: `DI-FYD-${num(d)}`, dn: d, bridas: 2, leKey: 'cople', norma: '—', qty: 1 }
      case 'check': {
        const bronce = DN_ORDER.indexOf(d) >= DN_ORDER.indexOf('18"')
        return { id: n.id, label: bronce ? `Check Compuerta Bronce ${d} Sigma Flow` : `Check Resilente C508 ${d} Sigma Flow`, sku: bronce ? `VI-CHK-${num(d)}` : `VI-CHK-R${num(d)}`, dn: d, bridas: 2, leKey: 'check', norma: 'AWWA C508', qty: 1 }
      }
      case 'tapa': return { id: n.id, label: `Tapa Ciega HD ${d} Sigma`, sku: TAPA[d] ?? '← CONF', dn: d, bridas: 1, leKey: 'tapa-ciega', norma: 'AWWA C110', qty: 1 }
      case 'vaea': return n.sub === 'vae'
        ? { id: n.id, label: `Válvula de Aire Adm/Exp (VAEA) ${d} Sigma Flow`, sku: `VI-VAE-${num(d)}`, dn: d, bridas: 1, leKey: 'tapa-ciega', norma: 'AWWA C512', qty: 1 }
        : n.sub === 'vea'
        ? { id: n.id, label: `Válvula Eliminadora de Aire ${d} Sigma Flow`, sku: `VI-VEA-${num(d)}`, dn: d, bridas: 1, leKey: 'tapa-ciega', norma: 'AWWA C512', qty: 1 }
        : { id: n.id, label: `Válvula de Aire Combinada ${d} Sigma Flow`, sku: `VI-VAC-${num(d)}`, dn: d, bridas: 1, leKey: 'tapa-ciega', norma: 'AWWA C512', qty: 1 }
    }
  })
  const conex: SIMEXConex[] = nodes
    .filter(n => n.parentId != null && byId.has(n.parentId!))
    .map(n => {
      const p = byId.get(n.parentId!)!
      const pdn = puertos(p)[n.parentPort ?? 0]?.dn ?? n.dn
      return { id: n.id, aId: n.parentId!, bId: n.id, dn: pdn }
    })
  return { accs, conex }
}

// ─── Layout con ángulos libres (los codos desvían el trazo) ────
const CELL = 96

interface Placed { x: number; y: number; ang: number; dirs: number[] }

function computeLayout(nodes: VizNode[]) {
  const root = nodes.find(n => n.parentId == null)
  const pos = new Map<number, Placed>()
  const links: { x1: number; y1: number; x2: number; y2: number; ang: number }[] = []
  if (!root) return { pos, links }

  function dirsDe(n: VizNode, angIn: number): number[] {
    const s = n.flip ? -1 : 1
    const back = angIn + 180
    switch (n.tipo) {
      case 'tee': return [back, angIn, angIn + s * 90]
      case 'cruz': return [back, angIn, angIn + 90, angIn - 90]
      case 'codo': return [back, angIn + s * (ANG_CODO[n.sub ?? '90'] ?? 90)]
      case 'tapa': case 'vaea': return [back]
      default: return [back, angIn]
    }
  }

  function place(n: VizNode, x: number, y: number, angIn: number) {
    pos.set(n.id, { x, y, ang: angIn, dirs: dirsDe(n, angIn) })
    const dirs = pos.get(n.id)!.dirs
    nodes.filter(k => k.parentId === n.id).forEach(k => {
      const a = dirs[k.parentPort ?? 0] ?? angIn
      const c = Math.cos(rad(a)), s = Math.sin(rad(a))
      let nx = x + c, ny = y + s, guard = 0
      const choca = (px: number, py: number) => Array.from(pos.values()).some(q => Math.hypot(q.x - px, q.y - py) < 0.62)
      while (choca(nx, ny) && guard < 8) { nx += c; ny += s; guard++ }
      links.push({ x1: x, y1: y, x2: nx, y2: ny, ang: a })
      place(k, nx, ny, a)
    })
  }
  place(root, 0, 0, 0)
  return { pos, links }
}

// ─── Símbolos de plano (coords locales, flujo entra por -X) ────
// Rayitas de brida perpendiculares al eje, colocadas a radio r en dirección ang
function TickAt({ r, ang = 0 }: { r: number; ang?: number }) {
  const a = rad(ang), c = Math.cos(a), s = Math.sin(a)
  const px = -s, py = c
  const seg = (off: number) => {
    const cx = (r + off) * c, cy = (r + off) * s
    return <line x1={cx - px * 10} y1={cy - py * 10} x2={cx + px * 10} y2={cy + py * 10} />
  }
  return <g>{seg(-2.5)}{seg(2.5)}</g>
}

// conn[i] = true si el puerto i está unido a otra pieza (la marca ‖ de la unión
// se dibuja UNA sola vez sobre el tubo de unión, no en cada pieza)
function Simbolo({ n, conn }: { n: VizNode; conn: boolean[] }) {
  const s = n.flip ? -1 : 1
  const t = (i: number) => !conn[i]  // dibujar brida solo si el puerto está libre
  switch (n.tipo) {
    case 'valv': {
      const mariposa = n.sub?.startsWith('vmb')
      return (<g>
        <line x1={-38} y1={0} x2={-18} y2={0} /><line x1={18} y1={0} x2={38} y2={0} />
        <path d="M -18 -11 L -18 11 L 0 0 Z" fill="none" /><path d="M 18 -11 L 18 11 L 0 0 Z" fill="none" />
        {mariposa ? <circle cx={0} cy={0} r={5.5} fill="none" /> : <><line x1={0} y1={0} x2={0} y2={-17} /><line x1={-6} y1={-17} x2={6} y2={-17} /></>}
        {t(0) && <TickAt r={27} ang={180} />}{t(1) && <TickAt r={27} />}
      </g>)
    }
    case 'codo': {
      // Simbología normada: la línea entra, se quiebra en el ángulo real y sale desviada
      const th = s * (ANG_CODO[n.sub ?? '90'] ?? 90)
      const ex = 38 * Math.cos(rad(th)), ey = 38 * Math.sin(rad(th))
      return (<g>
        <line x1={-38} y1={0} x2={0} y2={0} />
        <line x1={0} y1={0} x2={ex} y2={ey} />
        {t(0) && <TickAt r={30} ang={180} />}{t(1) && <TickAt r={30} ang={th} />}
      </g>)
    }
    case 'tee':
      return (<g><line x1={-38} y1={0} x2={38} y2={0} /><line x1={0} y1={0} x2={0} y2={38 * s} />{t(0) && <TickAt r={30} ang={180} />}{t(1) && <TickAt r={30} />}{t(2) && <TickAt r={30} ang={90 * s} />}</g>)
    case 'cruz':
      return (<g><line x1={-38} y1={0} x2={38} y2={0} /><line x1={0} y1={-38} x2={0} y2={38} />{t(0) && <TickAt r={30} ang={180} />}{t(1) && <TickAt r={30} />}{t(2) && <TickAt r={30} ang={90} />}{t(3) && <TickAt r={30} ang={-90} />}</g>)
    case 'reduccion':
      return (<g><line x1={-38} y1={0} x2={-20} y2={0} /><path d="M -20 -11 L 8 -5 L 8 5 L -20 11 Z" fill="none" /><line x1={8} y1={0} x2={38} y2={0} />{t(0) && <TickAt r={30} ang={180} />}{t(1) && <TickAt r={27} />}</g>)
    case 'carrete': {
      if (n.sub === 'corto') return (<g><line x1={-38} y1={0} x2={-9} y2={0} /><rect x={-9} y={-8} width={18} height={16} fill="none" /><line x1={9} y1={0} x2={38} y2={0} />{t(0) && <TickAt r={22} ang={180} />}{t(1) && <TickAt r={22} />}</g>)
      if (n.sub === 'largo') return (<g><line x1={-38} y1={0} x2={-26} y2={0} /><rect x={-26} y={-7} width={52} height={14} fill="none" /><line x1={26} y1={0} x2={38} y2={0} />{t(0) && <TickAt r={32} ang={180} />}{t(1) && <TickAt r={32} />}</g>)
      return (<g><line x1={-38} y1={0} x2={-16} y2={0} /><rect x={-16} y={-9} width={32} height={18} fill="none" /><line x1={-8} y1={-9} x2={-8} y2={9} /><line x1={8} y1={-9} x2={8} y2={9} /><line x1={16} y1={0} x2={38} y2={0} />{t(0) && <TickAt r={27} ang={180} />}{t(1) && <TickAt r={27} />}</g>)
    }
    case 'medidor':
      return (<g><line x1={-38} y1={0} x2={-12} y2={0} /><circle cx={0} cy={0} r={12} fill="none" /><text x={0} y={3.8} textAnchor="middle" fontSize={11} fontWeight={700} fill="currentColor" stroke="none">M</text><line x1={12} y1={0} x2={38} y2={0} />{t(0) && <TickAt r={24} ang={180} />}{t(1) && <TickAt r={24} />}</g>)
    case 'vcontrol':
      return (<g>
        <line x1={-38} y1={0} x2={-18} y2={0} /><line x1={18} y1={0} x2={38} y2={0} />
        <path d="M -18 -11 L -18 11 L 0 0 Z" fill="none" /><path d="M 18 -11 L 18 11 L 0 0 Z" fill="none" />
        <line x1={0} y1={0} x2={0} y2={-14} /><circle cx={0} cy={-20} r={6} fill="none" />
        {t(0) && <TickAt r={27} ang={180} />}{t(1) && <TickAt r={27} />}
      </g>)
    case 'filtro':
      return n.sub === 'canasta'
        ? (<g><line x1={-38} y1={0} x2={38} y2={0} /><path d="M -9 2 L -9 16 Q 0 22 9 16 L 9 2" fill="none" /><line x1={-6} y1={8} x2={6} y2={8} /><line x1={-6} y1={13} x2={6} y2={13} />{t(0) && <TickAt r={30} ang={180} />}{t(1) && <TickAt r={30} />}</g>)
        : (<g><line x1={-38} y1={0} x2={38} y2={0} /><line x1={-4} y1={0} x2={11} y2={16} /><line x1={6} y1={19} x2={16} y2={12} />{t(0) && <TickAt r={30} ang={180} />}{t(1) && <TickAt r={30} />}</g>)
    case 'tapa':
      return (<g><line x1={-38} y1={0} x2={-4} y2={0} /><rect x={-4} y={-13} width={6} height={26} fill="currentColor" stroke="none" />{t(0) && <TickAt r={16} ang={180} />}</g>)
    case 'check':
      return (<g><line x1={-38} y1={0} x2={-18} y2={0} /><line x1={18} y1={0} x2={38} y2={0} /><path d="M -18 -11 L -18 11 L 0 0 Z" fill="none" /><path d="M 18 -11 L 18 11 L 0 0 Z" fill="none" /><line x1={-8} y1={-16} x2={8} y2={-16} /><path d="M 8 -16 L 3 -19.5 M 8 -16 L 3 -12.5" fill="none" />{t(0) && <TickAt r={27} ang={180} />}{t(1) && <TickAt r={27} />}</g>)
    case 'vaea':
      return (<g><line x1={-38} y1={0} x2={-14} y2={0} /><circle cx={-2} cy={0} r={11} fill="none" /><line x1={4} y1={-14} x2={12} y2={-19} /><line x1={7} y1={-9} x2={16} y2={-12} />{t(0) && <TickAt r={24} ang={180} />}</g>)
  }
}

const NOMBRE: Record<string, (n: VizNode) => string> = {
  valv: n => (n.sub === 'vcg-r' ? 'V. Compuerta' : n.sub === 'vcg-b' ? 'V. Comp. Bronce' : 'V. Mariposa') + ` ${n.dn}`,
  codo: n => `Codo ${n.sub}° ${n.dn}`,
  tee: n => `Tee ${n.dn}${n.dn2 && n.dn2 !== n.dn ? '×' + n.dn2 : ''}`,
  cruz: n => `Cruz ${n.dn}${n.dn2 && n.dn2 !== n.dn ? '×' + n.dn2 : ''}`,
  reduccion: n => `Red. ${n.dn}×${n.dn2}`,
  carrete: n => `${n.sub === 'corto' ? 'Carrete corto' : n.sub === 'largo' ? 'Carrete largo' : 'Carrete desm.'} ${n.dn}`,
  tapa: n => `Tapa ${n.dn}`,
  check: n => `Check ${n.dn}`,
  vaea: n => `${n.sub === 'vea' ? 'V. Elim.' : n.sub === 'vae' ? 'VAEA' : 'V. Aire'} ${n.dn}`,
  medidor: n => `Medidor ${n.dn}`,
  vcontrol: n => `${n.sub === 'sost' ? 'V. Sostenedora' : n.sub === 'alt' ? 'V. Altitud' : 'VRP'} ${n.dn}`,
  filtro: n => `${n.sub === 'canasta' ? 'Filtro canasta' : 'Filtro Y'} ${n.dn}`,
}

// ─── Componente ─────────────────────────────────────────────────
interface Props {
  dn: string                       // DN principal del crucero
  nodes: VizNode[]
  onChange: (nodes: VizNode[]) => void
}

export default function CruceroVisual({ dn, nodes, onChange }: Props) {
  const [pending, setPending] = useState<{ nodeId: number | null; port: number | null; dn: string } | null>(null)
  const [sel, setSel] = useState<number | null>(null)
  const [subPick, setSubPick] = useState<'tee-red' | 'cruz-red' | 'reduc' | 'vcontrol' | null>(null)

  const { pos, links } = computeLayout(nodes)
  const byId = new Map(nodes.map(n => [n.id, n]))

  // Bridas libres (stubs): puertos sin padre ni hijo
  const stubs: { nodeId: number; port: number; dn: string; ang: number; x: number; y: number }[] = []
  nodes.forEach(n => {
    const p = pos.get(n.id); if (!p) return
    const prts = puertos(n)
    prts.forEach((prt, i) => {
      if (i === 0 && n.parentId != null) return                      // conecta al padre
      if (nodes.some(k => k.parentId === n.id && k.parentPort === i)) return  // tiene hijo
      stubs.push({ nodeId: n.id, port: i, dn: prt.dn, ang: p.dirs[i] ?? 0, x: p.x, y: p.y })
    })
  })

  const nUniones = nodes.filter(n => n.parentId != null).length
  const nLibres = stubs.length

  // Bounding box en píxeles (piezas + stubs + etiquetas)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  const meter = (px: number, py: number, m: number) => { minX = Math.min(minX, px - m); maxX = Math.max(maxX, px + m); minY = Math.min(minY, py - m); maxY = Math.max(maxY, py + m) }
  pos.forEach(p => meter(p.x * CELL, p.y * CELL, 56))
  stubs.forEach(st => meter(st.x * CELL + Math.cos(rad(st.ang)) * 78, st.y * CELL + Math.sin(rad(st.ang)) * 78, 26))
  if (!isFinite(minX)) { minX = -60; maxX = 60; minY = -60; maxY = 60 }
  const vb = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`

  function addNode(tipo: VizNode['tipo'], sub?: string, dn2?: string) {
    if (!pending) return
    const id = (nodes.reduce((m, n) => Math.max(m, n.id), 0) || 0) + 1
    onChange([...nodes, { id, tipo, sub, dn: pending.dn, dn2, parentId: pending.nodeId, parentPort: pending.port }])
    setPending(null); setSubPick(null)
  }

  function delNode(id: number) {
    const drop = new Set<number>([id])
    let grew = true
    while (grew) { grew = false; nodes.forEach(n => { if (n.parentId != null && drop.has(n.parentId) && !drop.has(n.id)) { drop.add(n.id); grew = true } }) }
    if (drop.size > 1 && !confirm(`Se eliminará esta pieza y las ${drop.size - 1} conectadas después de ella. ¿Continuar?`)) return
    onChange(nodes.filter(n => !drop.has(n.id)))
    setSel(null); setPending(null)
  }

  const dnsMenores = (d: string) => DN_ORDER.filter(x => DN_ORDER.indexOf(x) < DN_ORDER.indexOf(d))
  const selNode = sel != null ? byId.get(sel) : undefined
  const volteable = selNode && (selNode.tipo === 'codo' || selNode.tipo === 'tee')

  return (
    <div className="space-y-3">
      {/* Lienzo */}
      {nodes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#1C3D5A]/25 bg-[#1C3D5A]/[0.02] p-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">El crucero se dibuja aquí con símbolos de plano.</p>
          <button onClick={() => { setPending({ nodeId: null, port: null, dn }); setSubPick(null) }} className="text-xs bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors">⊕ Colocar primera pieza ({dn})</button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1C3D5A]/20 bg-white dark:bg-gray-900 overflow-hidden">
          <svg viewBox={vb} className="w-full" style={{ maxHeight: 380 }}>
            <g className="text-[#1C3D5A] dark:text-blue-300" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {/* tubos de unión pieza-pieza + marca de unión bridada */}
              {links.map((l, i) => {
                const c = Math.cos(rad(l.ang)), s = Math.sin(rad(l.ang))
                const x1 = l.x1 * CELL + c * 38, y1 = l.y1 * CELL + s * 38
                const x2 = l.x2 * CELL - c * 38, y2 = l.y2 * CELL - s * 38
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
                const px = -s * 10, py = c * 10
                return (<g key={`l${i}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} />
                  <line x1={mx - px - c * 2.5} y1={my - py - s * 2.5} x2={mx + px - c * 2.5} y2={my + py - s * 2.5} />
                  <line x1={mx - px + c * 2.5} y1={my - py + s * 2.5} x2={mx + px + c * 2.5} y2={my + py + s * 2.5} />
                </g>)
              })}
              {/* bridas libres → a tubería (+ botón) */}
              {stubs.map((st, i) => {
                const c = Math.cos(rad(st.ang)), s = Math.sin(rad(st.ang))
                const cx = st.x * CELL, cy = st.y * CELL
                const bx = cx + c * 78, by = cy + s * 78
                const activo = pending && pending.nodeId === st.nodeId && pending.port === st.port
                return (<g key={`s${i}`} className="cursor-pointer" onClick={() => { setPending({ nodeId: st.nodeId, port: st.port, dn: st.dn }); setSubPick(null); setSel(null) }}>
                  <line x1={cx + c * 40} y1={cy + s * 40} x2={cx + c * 62} y2={cy + s * 62} strokeDasharray="4 4" opacity={0.55} />
                  <circle cx={bx} cy={by} r={11} fill={activo ? 'currentColor' : 'white'} className={activo ? '' : 'dark:fill-gray-800'} />
                  <text x={bx} y={by + 4} textAnchor="middle" fontSize={14} fontWeight={700} fill={activo ? 'white' : 'currentColor'} stroke="none">+</text>
                  {st.dn !== dn && <text x={bx} y={by + 24} textAnchor="middle" fontSize={8} className="fill-gray-400" stroke="none">{st.dn}</text>}
                </g>)
              })}
              {/* piezas */}
              {nodes.map(n => {
                const p = pos.get(n.id); if (!p) return null
                const cx = p.x * CELL, cy = p.y * CELL
                const seleccionada = sel === n.id
                const conn = puertos(n).map((_, i) => (i === 0 && n.parentId != null) || nodes.some(k => k.parentId === n.id && k.parentPort === i))
                return (<g key={n.id} className="cursor-pointer" onClick={() => { setSel(x => x === n.id ? null : n.id); setPending(null) }}>
                  {/* zona de clic grande e invisible (las líneas solas son muy delgadas para atinarle) */}
                  <rect x={cx - 34} y={cy - 34} width={68} height={68} fill="transparent" stroke="none" />
                  {seleccionada && <rect x={cx - 32} y={cy - 32} width={64} height={64} rx={10} fill="currentColor" opacity={0.08} strokeDasharray="5 4" strokeWidth={1.5} />}
                  <g transform={`translate(${cx},${cy}) rotate(${p.ang})`}><Simbolo n={n} conn={conn} /></g>
                  <text x={cx} y={cy + 47} textAnchor="middle" fontSize={9} className="fill-gray-500 dark:fill-gray-400" stroke="none">{NOMBRE[n.tipo](n)}</text>
                  {seleccionada && (
                    <g onClick={(e) => { e.stopPropagation(); delNode(n.id) }}>
                      <circle cx={cx + 32} cy={cy - 32} r={10} fill="#ef4444" stroke="none" />
                      <text x={cx + 32} y={cy - 28.2} textAnchor="middle" fontSize={11} fontWeight={700} fill="white" stroke="none">✕</text>
                    </g>
                  )}
                </g>)
              })}
            </g>
          </svg>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex-wrap">
            <p className="text-[10px] text-gray-400">⊕ conectar pieza · ‖ unión bridada (empaque + tornillos) · ┄ brida libre → a tubería (con adaptador) · toca una pieza para borrarla ✕</p>
            <p className="text-[10px] font-medium text-[#1C3D5A] dark:text-blue-300">{nodes.length} pieza(s) · {nUniones} unión(es) · {nLibres} a tubería</p>
          </div>
        </div>
      )}

      {/* Pieza seleccionada */}
      {selNode && (
        <div className="flex items-center gap-3 bg-[#1C3D5A]/[0.04] dark:bg-gray-800/50 border border-[#1C3D5A]/15 rounded-lg px-3 py-2 flex-wrap">
          <span className="text-xs text-gray-600 dark:text-gray-300 flex-1"><strong>{NOMBRE[selNode.tipo](selNode)}</strong></span>
          {volteable && (
            <button onClick={() => onChange(nodes.map(n => n.id === sel ? { ...n, flip: !n.flip } : n))} className="text-[11px] text-[#1C3D5A] dark:text-blue-300 hover:bg-[#1C3D5A]/10 border border-[#1C3D5A]/25 rounded-lg px-2.5 py-1">⇅ Voltear lado</button>
          )}
          <button onClick={() => delNode(sel!)} className="text-[11px] text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1">Eliminar pieza</button>
          <button onClick={() => setSel(null)} className="text-[11px] text-gray-400 px-1">✕</button>
        </div>
      )}

      {/* Paleta de piezas */}
      {pending && (
        <div className="rounded-xl border border-[#1C3D5A]/25 bg-white dark:bg-gray-800 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300">
              {pending.nodeId == null || !byId.has(pending.nodeId) ? `Primera pieza del crucero — ${pending.dn}` : `Conectar en ${NOMBRE[byId.get(pending.nodeId)!.tipo](byId.get(pending.nodeId)!)} — brida ${pending.dn}`}
            </p>
            <button onClick={() => { setPending(null); setSubPick(null) }} className="text-[11px] text-gray-400 hover:text-gray-600 px-1">✕ Cancelar</button>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-20 shrink-0">Válvulas:</span>
              {(['vcg-r', 'vcg-b', 'vmb-c'] as const).filter(t => VALV[t]?.[pending.dn]).map(t => (
                <button key={t} onClick={() => addNode('valv', t)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">{t === 'vcg-r' ? '⧓ Compuerta' : t === 'vcg-b' ? '⧓ Comp. Bronce' : '⧓ Mariposa'}</button>
              ))}
              <button onClick={() => addNode('check')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">⧓→ Check</button>
              <button onClick={() => setSubPick(x => x === 'vcontrol' ? null : 'vcontrol')} className={`px-3 py-1.5 text-[11px] rounded-lg border transition-colors ${subPick === 'vcontrol' ? 'border-[#1C3D5A] bg-[#1C3D5A]/5 font-medium' : 'border-gray-200 dark:border-gray-600'}`}>⚙ De control…</button>
              <button onClick={() => addNode('filtro')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">⋔ Filtro Y</button>
              <button onClick={() => addNode('filtro', 'canasta')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">⊔ Filtro canasta</button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-20 shrink-0">Codos:</span>
              {['11', '22', '45', '90'].map(a => (
                <button key={a} onClick={() => addNode('codo', a)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">↩ {a}°</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-20 shrink-0">Derivación:</span>
              <button onClick={() => addNode('tee', undefined, undefined)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">⑂ Tee {pending.dn}</button>
              <button onClick={() => setSubPick(x => x === 'tee-red' ? null : 'tee-red')} className={`px-3 py-1.5 text-[11px] rounded-lg border transition-colors ${subPick === 'tee-red' ? 'border-[#1C3D5A] bg-[#1C3D5A]/5 font-medium' : 'border-gray-200 dark:border-gray-600'}`}>⑂ Tee reducida…</button>
              <button onClick={() => addNode('cruz', undefined, undefined)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">✚ Cruz {pending.dn}</button>
              <button onClick={() => setSubPick(x => x === 'cruz-red' ? null : 'cruz-red')} className={`px-3 py-1.5 text-[11px] rounded-lg border transition-colors ${subPick === 'cruz-red' ? 'border-[#1C3D5A] bg-[#1C3D5A]/5 font-medium' : 'border-gray-200 dark:border-gray-600'}`}>✚ Cruz reducida…</button>
              <button onClick={() => setSubPick(x => x === 'reduc' ? null : 'reduc')} className={`px-3 py-1.5 text-[11px] rounded-lg border transition-colors ${subPick === 'reduc' ? 'border-[#1C3D5A] bg-[#1C3D5A]/5 font-medium' : 'border-gray-200 dark:border-gray-600'}`}>▷ Reducción…</button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-20 shrink-0">Carretes:</span>
              <button onClick={() => addNode('carrete', 'corto')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">▯ Corto</button>
              <button onClick={() => addNode('carrete', 'largo')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">▭ Largo</button>
              <button onClick={() => addNode('carrete')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">⚙ De desmontaje</button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-20 shrink-0">Medición/aire:</span>
              <button onClick={() => addNode('medidor')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">Ⓜ Medidor de flujo</button>
              {AIRE_VAC.has(pending.dn) && <button onClick={() => addNode('vaea', 'vac')} className="px-3 py-1.5 text-[11px] rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors">◍ V. aire combinada</button>}
              {AIRE_VAE.has(pending.dn) && <button onClick={() => addNode('vaea', 'vae')} className="px-3 py-1.5 text-[11px] rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors">◍ VAEA adm/exp</button>}
              {AIRE_VEA.has(pending.dn) && <button onClick={() => addNode('vaea', 'vea')} className="px-3 py-1.5 text-[11px] rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors">◍ Eliminadora</button>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-20 shrink-0">Fin de línea:</span>
              <button onClick={() => addNode('tapa')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">◉ Tapa ciega</button>
            </div>
          </div>

          {subPick === 'vcontrol' && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 dark:text-gray-300 mb-1.5">Tipo de válvula de control hidráulica (SKU a confirmar con distribuidor):</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => addNode('vcontrol', 'vrp')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-[#1C3D5A] hover:text-white transition-colors">Reductora de presión (VRP)</button>
                <button onClick={() => addNode('vcontrol', 'sost')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-[#1C3D5A] hover:text-white transition-colors">Sostenedora / Alivio</button>
                <button onClick={() => addNode('vcontrol', 'alt')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-[#1C3D5A] hover:text-white transition-colors">De altitud (tanque)</button>
              </div>
            </div>
          )}

          {subPick && subPick !== 'vcontrol' && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 dark:text-gray-300 mb-1.5">{subPick === 'reduc' ? `Reducir de ${pending.dn} a:` : `Diámetro del ramal:`}</p>
              <div className="flex flex-wrap gap-1.5">
                {dnsMenores(pending.dn).map(d2 => (
                  <button key={d2} onClick={() => addNode(subPick === 'reduc' ? 'reduccion' : subPick === 'tee-red' ? 'tee' : 'cruz', undefined, d2)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-[#1C3D5A] hover:text-white transition-colors">{d2}</button>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-400">Las piezas se conectan brida con brida (solo empaque + tornillos). Las bridas que dejes libres se conectan a la tubería con su adaptador.</p>
        </div>
      )}

      {/* Acciones */}
      {nodes.length > 0 && (
        <div className="flex justify-end">
          <button onClick={() => { if (confirm('¿Borrar todo el crucero?')) { onChange([]); setPending(null); setSel(null) } }} className="text-[11px] text-red-400 hover:text-red-600 px-2 py-1 rounded border border-red-200">Borrar crucero ×</button>
        </div>
      )}
    </div>
  )
}
