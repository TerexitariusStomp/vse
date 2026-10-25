import dagre from 'dagre'
import { useMemo } from 'react'
import { signalMap, useResults, type Intervention, type View } from '../lib'

/** Signals ↔ interventions bipartite network, laid out by dagre (FR-D6). */
export function BipartiteGraph({
  view,
  onOpen,
}: {
  view: View
  onOpen: (i: Intervention) => void
}) {
  const results = useResults()
  const signals = signalMap(results)
  const interventions = results.interventions[view]

  const { nodes, edges, width, height } = useMemo(() => {
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: 24, ranksep: 140, marginx: 8, marginy: 8 })
    g.setDefaultEdgeLabel(() => ({}))

    const sigNodes = interventions
      .flatMap((i) => i.signal_ids)
      .filter((id, i, a) => a.indexOf(id) === i)
    const NW = 224
    const nodeH = 44
    const meta = new Map<
      string,
      { kind: 'signal' | 'intervention'; label: string; ref?: Intervention }
    >()
    for (const id of sigNodes) {
      const label = signals.get(id)?.statement ?? id
      meta.set(`s:${id}`, { kind: 'signal', label })
      g.setNode(`s:${id}`, { width: NW, height: nodeH })
    }
    for (const i of interventions) {
      meta.set(`i:${i.id}`, { kind: 'intervention', label: i.name, ref: i })
      g.setNode(`i:${i.id}`, { width: NW, height: nodeH })
      for (const s of i.signal_ids) g.setEdge(`s:${s}`, `i:${i.id}`)
    }
    dagre.layout(g)
    const dim = g.graph()
    return {
      nodes: g.nodes().map((n) => ({ key: n, ...g.node(n), ...meta.get(n)! })),
      edges: g.edges().map((e) => g.edge(e)),
      width: dim.width ?? 0,
      height: dim.height ?? 0,
    }
  }, [interventions, signals])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-4xl"
      role="img"
      aria-label="Network of signals and interventions"
    >
      {edges.map((e, i) => {
        const pts = e.points
        const d = `M ${pts[0].x} ${pts[0].y} ` + pts
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(' ')
        return (
          <path
            key={i}
            d={d}
            fill="none"
            className="stroke-line"
            strokeWidth={1.5}
          />
        )
      })}
      {nodes.map((n) => (
        <g
          key={n.key}
          transform={`translate(${n.x - n.width / 2},${n.y - n.height / 2})`}
          onClick={n.ref ? () => onOpen(n.ref!) : undefined}
          className={n.kind === 'intervention' ? 'cursor-pointer' : ''}
        >
          <rect
            width={n.width}
            height={n.height}
            rx={3}
            className={
              n.kind === 'signal'
                ? 'fill-chrome stroke-line'
                : 'fill-sage/10 stroke-sage'
            }
          />
          <text
            x={n.width / 2}
            y={n.height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-ink text-[12px]"
          >
            {truncate(String(n.label), 40)}
          </text>
        </g>
      ))}
    </svg>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
