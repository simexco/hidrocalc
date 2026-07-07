"use client"

// ═══════════════════════════════════════════════════════════════
//  CRUCERO VISUAL — armado guiado con símbolos de plano
//  El ing arma el crucero pieza por pieza: cada brida libre muestra
//  un botón + para conectar la siguiente pieza. Las bridas libres
//  van "a tubería" (con adaptador); las uniones entre piezas solo
//  llevan empaque + tornillos. De aquí se deriva la lista SIMEX.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { SIMEX_CAT, type SIMEXAcc, type SIMEXConex } from './ListaMaterialesSIMEX'

const { findConn, VALV, VALV_LABEL, VALV_NORMA, TAPA, CDM, DN_ORDER } = SIMEX_CAT

// ─── Tipos ──────────────────────────────────────────────────────
export interface VizNode {
  id: number
  tipo: 'valv' | 'codo' | 'tee' | 'cruz' | 'reduccion' | 'carrete' | 'tapa' | 'check' | 'vaea'
  sub?: string          // valv: vcg-r|vcg-b|vmb-c · codo: 11|22|45|90 · vaea: vac|vae
  dn: string
  dn2?: string          // tee/cruz reducida, reducción
  parentId: number | null
  parentPort: number | null
}

const num = (d: string) => d.replace('"', '').replace('½', '.5')

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
      case 'carrete': return { id: n.id, label: `Carrete de Desmontaje ${d} Sigma Flow`, sku: CDM[d] ?? '← CONF', dn: d, bridas: 2, leKey: 'cople', norma: 'AWWA', qty: 1 }
      case 'check': {
        const bronce = DN_ORDER.indexOf(d) >= DN_ORDER.indexOf('18"')
        return { id: n.id, label: bronce ? `Check Compuerta Bronce ${d} Sigma Flow` : `Check Resilente C508 ${d} Sigma Flow`, sku: bronce ? `VI-CHK-${num(d)}` : `VI-CHK-R${num(d)}`, dn: d, bridas: 2, leKey: 'check', norma: 'AWWA C508', qty: 1 }
      }
      case 'tapa': return { id: n.id, label: `Tapa Ciega HD ${d} Sigma`, sku: TAPA[d] ?? '← CONF', dn: d, bridas: 1, leKey: 'tapa-ciega', norma: 'AWWA C110', qty: 1 }
      case 'vaea': return n.sub === 'vae'
        ? { id: n.id, label: `Válvula de Aire Adm/Exp (VAEA) ${d} Sigma Flow`, sku: `VI-VAE-${num(d)}`, dn: d, bridas: 1, leKey: 'tapa-ciega', norma: 'AWWA C512', qty: 1 }
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

// ─── Layout ortogonal ───────────────────────────────────────────
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]  // E, S, W, N
const CELL = 96

interface Placed { x: number; y: number; dirIn: number; dirs: number[] }

function computeLayout(nodes: VizNode[]) {
  const root = nodes.find(n => n.parentId == null)
  const pos = new Map<number, Placed>()
  if (!root) return { pos, links: [] as { x1: number; y1: number; x2: number; y2: number; d: number }[] }
  const occ = new Set<string>()
  const links: { x1: number; y1: number; x2: number; y2: number; d: number }[] = []

  function dirsDe(n: VizNode, dirIn: number): number[] {
    const cw = (dirIn + 1) % 4, ccw = (dirIn + 3) % 4, opp = (dirIn + 2) % 4
    switch (n.tipo) {
      case 'tee': return [opp, dirIn, cw]
      case 'cruz': return [opp, dirIn, cw, ccw]
      case 'codo': return [opp, n.sub === '90' ? cw : dirIn]
      case 'tapa': case 'vaea': return [opp]
      default: return [opp, dirIn]
    }
  }

  function place(n: VizNode, x: number, y: number, dirIn: number) {
    occ.add(`${x},${y}`)
    const dirs = dirsDe(n, dirIn)
    pos.set(n.id, { x, y, dirIn, dirs })
    nodes.filter(k => k.parentId === n.id).forEach(k => {
      const d = dirs[k.parentPort ?? 0] ?? dirIn
      let nx = x + DX[d], ny = y + DY[d], guard = 0
      while (occ.has(`${nx},${ny}`) && guard < 8) { nx += DX[d]; ny += DY[d]; guard++ }
      links.push({ x1: x, y1: y, x2: nx, y2: ny, d })
      place(k, nx, ny, d)
    })
  }
  place(root, 0, 0, 0)
  return { pos, links }
}

// ─── Símbolos de plano (coords locales, flujo +X) ──────────────
function Ticks({ at, branch = false }: { at: number; branch?: boolean }) {
  // par de rayitas (brida); branch=true → en el eje Y (ramal)
  return branch
    ? <g><line x1={-10} y1={at - 2.5} x2={10} y2={at - 2.5} /><line x1={-10} y1={at + 2.5} x2={10} y2={at + 2.5} /></g>
    : <g><line x1={at - 2.5} y1={-10} x2={at - 2.5} y2={10} /><line x1={at + 2.5} y1={-10} x2={at + 2.5} y2={10} /></g>
}

function Simbolo({ n }: { n: VizNode }) {
  switch (n.tipo) {
    case 'valv': {
      const mariposa = n.sub?.startsWith('vmb')
      return (<g>
        <line x1={-38} y1={0} x2={-18} y2={0} /><line x1={18} y1={0} x2={38} y2={0} />
        <path d="M -18 -11 L -18 11 L 0 0 Z" fill="none" /><path d="M 18 -11 L 18 11 L 0 0 Z" fill="none" />
        {mariposa ? <circle cx={0} cy={0} r={5.5} fill="none" /> : <><line x1={0} y1={0} x2={0} y2={-17} /><line x1={-6} y1={-17} x2={6} y2={-17} /></>}
        <Ticks at={-27} /><Ticks at={27} />
      </g>)
    }
    case 'codo':
      return n.sub === '90'
        ? (<g><path d="M -38 0 L -8 0 Q 0 0 0 8 L 0 38" fill="none" /><Ticks at={-30} /><Ticks at={30} branch /></g>)
        : (<g><path d="M -38 0 L -10 0 L 0 -7 L 10 0 L 38 0" fill="none" /><Ticks at={-30} /><Ticks at={30} /></g>)
    case 'tee':
      return (<g><line x1={-38} y1={0} x2={38} y2={0} /><line x1={0} y1={0} x2={0} y2={38} /><Ticks at={-30} /><Ticks at={30} /><Ticks at={30} branch /></g>)
    case 'cruz':
      return (<g><line x1={-38} y1={0} x2={38} y2={0} /><line x1={0} y1={-38} x2={0} y2={38} /><Ticks at={-30} /><Ticks at={30} /><Ticks at={30} branch /><Ticks at={-30} branch /></g>)
    case 'reduccion':
      return (<g><line x1={-38} y1={0} x2={-20} y2={0} /><path d="M -20 -11 L 8 -5 L 8 5 L -20 11 Z" fill="none" /><line x1={8} y1={0} x2={38} y2={0} /><Ticks at={-30} /><Ticks at={27} /></g>)
    case 'carrete':
      return (<g><line x1={-38} y1={0} x2={-16} y2={0} /><rect x={-16} y={-9} width={32} height={18} fill="none" /><line x1={-8} y1={-9} x2={-8} y2={9} /><line x1={8} y1={-9} x2={8} y2={9} /><line x1={16} y1={0} x2={38} y2={0} /><Ticks at={-27} /><Ticks at={27} /></g>)
    case 'tapa':
      return (<g><line x1={-38} y1={0} x2={-4} y2={0} /><rect x={-4} y={-13} width={6} height={26} fill="currentColor" stroke="none" /><Ticks at={-16} /></g>)
    case 'check':
      return (<g><line x1={-38} y1={0} x2={-18} y2={0} /><line x1={18} y1={0} x2={38} y2={0} /><path d="M -18 -11 L -18 11 L 0 0 Z" fill="none" /><path d="M 18 -11 L 18 11 L 0 0 Z" fill="none" /><line x1={-8} y1={-16} x2={8} y2={-16} /><path d="M 8 -16 L 3 -19.5 M 8 -16 L 3 -12.5" fill="none" /><Ticks at={-27} /><Ticks at={27} /></g>)
    case 'vaea':
      return (<g><line x1={-38} y1={0} x2={-14} y2={0} /><circle cx={-2} cy={0} r={11} fill="none" /><line x1={4} y1={-14} x2={12} y2={-19} /><line x1={7} y1={-9} x2={16} y2={-12} /><Ticks at={-24} /></g>)
  }
}

const NOMBRE: Record<string, (n: VizNode) => string> = {
  valv: n => (n.sub === 'vcg-r' ? 'V. Compuerta' : n.sub === 'vcg-b' ? 'V. Comp. Bronce' : 'V. Mariposa') + ` ${n.dn}`,
  codo: n => `Codo ${n.sub}° ${n.dn}`,
  tee: n => `Tee ${n.dn}${n.dn2 && n.dn2 !== n.dn ? '×' + n.dn2 : ''}`,
  cruz: n => `Cruz ${n.dn}${n.dn2 && n.dn2 !== n.dn ? '×' + n.dn2 : ''}`,
  reduccion: n => `Red. ${n.dn}×${n.dn2}`,
  carrete: n => `Carrete ${n.dn}`,
  tapa: n => `Tapa ${n.dn}`,
  check: n => `Check ${n.dn}`,
  vaea: n => `V. Aire ${n.dn}`,
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
  const [subPick, setSubPick] = useState<'tee-red' | 'cruz-red' | 'reduc' | null>(null)

  const { pos, links } = computeLayout(nodes)
  const byId = new Map(nodes.map(n => [n.id, n]))

  // Bridas libres (stubs): puertos sin padre ni hijo
  const stubs: { nodeId: number; port: number; dn: string; d: number; x: number; y: number }[] = []
  nodes.forEach(n => {
    const p = pos.get(n.id); if (!p) return
    const prts = puertos(n)
    prts.forEach((prt, i) => {
      if (i === 0 && n.parentId != null) return                      // conecta al padre
      if (nodes.some(k => k.parentId === n.id && k.parentPort === i)) return  // tiene hijo
      stubs.push({ nodeId: n.id, port: i, dn: prt.dn, d: p.dirs[i] ?? 0, x: p.x, y: p.y })
    })
  })

  const nUniones = nodes.filter(n => n.parentId != null).length
  const nLibres = stubs.length

  // Bounding box
  let minX = 0, maxX = 0, minY = 0, maxY = 0
  pos.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y) })
  stubs.forEach(s => { minX = Math.min(minX, s.x + DX[s.d]); maxX = Math.max(maxX, s.x + DX[s.d]); minY = Math.min(minY, s.y + DY[s.d]); maxY = Math.max(maxY, s.y + DY[s.d]) })
  const PAD = 58
  const vb = `${minX * CELL - PAD} ${minY * CELL - PAD} ${(maxX - minX) * CELL + 2 * PAD} ${(maxY - minY) * CELL + 2 * PAD + 14}`

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
  const esDnChico = pending ? ['2"', '2½"', '3"'].includes(pending.dn) : false

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
                const x1 = l.x1 * CELL + DX[l.d] * 38, y1 = l.y1 * CELL + DY[l.d] * 38
                const x2 = l.x2 * CELL - DX[l.d] * 38, y2 = l.y2 * CELL - DY[l.d] * 38
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
                const px = DY[l.d] * 9, py = DX[l.d] * 9  // perpendicular
                return (<g key={`l${i}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} />
                  <line x1={mx - px - DX[l.d] * 2.5} y1={my - py - DY[l.d] * 2.5} x2={mx + px - DX[l.d] * 2.5} y2={my + py - DY[l.d] * 2.5} />
                  <line x1={mx - px + DX[l.d] * 2.5} y1={my - py + DY[l.d] * 2.5} x2={mx + px + DX[l.d] * 2.5} y2={my + py + DY[l.d] * 2.5} />
                </g>)
              })}
              {/* bridas libres → a tubería (+ botón) */}
              {stubs.map((s, i) => {
                const cx = s.x * CELL, cy = s.y * CELL
                const bx = cx + DX[s.d] * 78, by = cy + DY[s.d] * 78
                const activo = pending && pending.nodeId === s.nodeId && pending.port === s.port
                return (<g key={`s${i}`} className="cursor-pointer" onClick={() => { setPending({ nodeId: s.nodeId, port: s.port, dn: s.dn }); setSubPick(null); setSel(null) }}>
                  <line x1={cx + DX[s.d] * 40} y1={cy + DY[s.d] * 40} x2={cx + DX[s.d] * 62} y2={cy + DY[s.d] * 62} strokeDasharray="4 4" opacity={0.55} />
                  <circle cx={bx} cy={by} r={11} fill={activo ? 'currentColor' : 'white'} className={activo ? '' : 'dark:fill-gray-800'} />
                  <text x={bx} y={by + 4} textAnchor="middle" fontSize={14} fontWeight={700} fill={activo ? 'white' : 'currentColor'} stroke="none">+</text>
                  {s.dn !== dn && <text x={bx} y={by + 22} textAnchor="middle" fontSize={8} className="fill-gray-400" stroke="none">{s.dn}</text>}
                </g>)
              })}
              {/* piezas */}
              {nodes.map(n => {
                const p = pos.get(n.id); if (!p) return null
                const cx = p.x * CELL, cy = p.y * CELL
                const seleccionada = sel === n.id
                return (<g key={n.id} className="cursor-pointer" onClick={() => { setSel(x => x === n.id ? null : n.id); setPending(null) }}>
                  {seleccionada && <rect x={cx - 32} y={cy - 32} width={64} height={64} rx={10} fill="currentColor" opacity={0.08} strokeDasharray="5 4" strokeWidth={1.5} />}
                  <g transform={`translate(${cx},${cy}) rotate(${p.dirIn * 90})`}><Simbolo n={n} /></g>
                  <text x={cx} y={cy + 47} textAnchor="middle" fontSize={9} className="fill-gray-500 dark:fill-gray-400" stroke="none">{NOMBRE[n.tipo](n)}</text>
                </g>)
              })}
            </g>
          </svg>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex-wrap">
            <p className="text-[10px] text-gray-400">⊕ conectar pieza · ‖ unión bridada (empaque + tornillos) · ┄ brida libre → a tubería (con adaptador)</p>
            <p className="text-[10px] font-medium text-[#1C3D5A] dark:text-blue-300">{nodes.length} pieza(s) · {nUniones} unión(es) · {nLibres} a tubería</p>
          </div>
        </div>
      )}

      {/* Pieza seleccionada */}
      {sel != null && byId.has(sel) && (
        <div className="flex items-center gap-3 bg-[#1C3D5A]/[0.04] dark:bg-gray-800/50 border border-[#1C3D5A]/15 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-600 dark:text-gray-300 flex-1"><strong>{NOMBRE[byId.get(sel)!.tipo](byId.get(sel)!)}</strong></span>
          <button onClick={() => delNode(sel)} className="text-[11px] text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1">Eliminar pieza</button>
          <button onClick={() => setSel(null)} className="text-[11px] text-gray-400 px-1">✕</button>
        </div>
      )}

      {/* Paleta de piezas */}
      {pending && (
        <div className="rounded-xl border border-[#1C3D5A]/25 bg-white dark:bg-gray-800 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300">
              {pending.nodeId == null ? `Primera pieza del crucero — ${pending.dn}` : `Conectar en ${NOMBRE[byId.get(pending.nodeId)!.tipo](byId.get(pending.nodeId)!)} — brida ${pending.dn}`}
            </p>
            <button onClick={() => { setPending(null); setSubPick(null) }} className="text-[11px] text-gray-400 hover:text-gray-600 px-1">✕ Cancelar</button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['vcg-r', 'vcg-b', 'vmb-c'] as const).filter(t => VALV[t]?.[pending.dn]).map(t => (
              <button key={t} onClick={() => addNode('valv', t)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">{t === 'vcg-r' ? '⧓ V. Compuerta' : t === 'vcg-b' ? '⧓ V. Comp. Bronce' : '⧓ V. Mariposa'}</button>
            ))}
            {['11', '22', '45', '90'].map(a => (
              <button key={a} onClick={() => addNode('codo', a)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">↩ Codo {a}°</button>
            ))}
            <button onClick={() => addNode('tee', undefined, undefined)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">⑂ Tee {pending.dn}</button>
            <button onClick={() => setSubPick(x => x === 'tee-red' ? null : 'tee-red')} className={`px-3 py-1.5 text-[11px] rounded-lg border transition-colors ${subPick === 'tee-red' ? 'border-[#1C3D5A] bg-[#1C3D5A]/5 font-medium' : 'border-gray-200 dark:border-gray-600'}`}>⑂ Tee reducida…</button>
            <button onClick={() => addNode('cruz', undefined, undefined)} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">✚ Cruz {pending.dn}</button>
            <button onClick={() => setSubPick(x => x === 'cruz-red' ? null : 'cruz-red')} className={`px-3 py-1.5 text-[11px] rounded-lg border transition-colors ${subPick === 'cruz-red' ? 'border-[#1C3D5A] bg-[#1C3D5A]/5 font-medium' : 'border-gray-200 dark:border-gray-600'}`}>✚ Cruz reducida…</button>
            <button onClick={() => setSubPick(x => x === 'reduc' ? null : 'reduc')} className={`px-3 py-1.5 text-[11px] rounded-lg border transition-colors ${subPick === 'reduc' ? 'border-[#1C3D5A] bg-[#1C3D5A]/5 font-medium' : 'border-gray-200 dark:border-gray-600'}`}>▷ Reducción…</button>
            <button onClick={() => addNode('carrete')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">▭ Carrete desmontaje</button>
            <button onClick={() => addNode('check')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">⧓→ Check</button>
            <button onClick={() => addNode('tapa')} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">◉ Tapa ciega</button>
            {esDnChico && (<>
              <button onClick={() => addNode('vaea', 'vac')} className="px-3 py-1.5 text-[11px] rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors">◍ V. aire combinada</button>
              <button onClick={() => addNode('vaea', 'vae')} className="px-3 py-1.5 text-[11px] rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors">◍ VAEA adm/exp</button>
            </>)}
          </div>

          {subPick && (
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
