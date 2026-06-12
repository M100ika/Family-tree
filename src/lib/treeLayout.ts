import type { Person } from '../types'

export const CARD_W  = 220
export const CARD_H  = 80
export const H_GAP   = 32   // horizontal gap between cards
export const V_STEP  = 160  // vertical distance from one row top to the next

export interface NodePos { x: number; y: number }

/**
 * Returns center-relative positions for each person.
 * x=0 means the horizontal center of the entire layout.
 * y=0 is the top generation.
 */
export function buildTreeLayout(people: Person[]): Map<string, NodePos> {
  if (!people.length) return new Map()

  const idSet = new Set(people.map(p => p.id))
  const genMap = new Map<string, number>()

  // Memoised DFS with cycle guard
  function getGen(id: string, stack: Set<string>): number {
    if (genMap.has(id)) return genMap.get(id)!
    if (stack.has(id)) return 0

    const p = people.find(x => x.id === id)
    if (!p) { genMap.set(id, 0); return 0 }

    stack.add(id)
    const fGen = p.fatherId && idSet.has(p.fatherId) ? getGen(p.fatherId, new Set(stack)) : -1
    const mGen = p.motherId && idSet.has(p.motherId) ? getGen(p.motherId, new Set(stack)) : -1
    stack.delete(id)

    const gen = Math.max(fGen, mGen) + 1
    genMap.set(id, gen)
    return gen
  }

  people.forEach(p => getGen(p.id, new Set()))

  // Group by generation
  const byGen = new Map<number, Person[]>()
  people.forEach(p => {
    const g = genMap.get(p.id) ?? 0
    if (!byGen.has(g)) byGen.set(g, [])
    byGen.get(g)!.push(p)
  })

  // Within each generation: place spouses adjacent
  byGen.forEach((gp, g) => {
    const ordered: Person[] = []
    const done = new Set<string>()
    gp.forEach(p => {
      if (done.has(p.id)) return
      ordered.push(p); done.add(p.id)
      const spouse = p.spouseId ? gp.find(x => x.id === p.spouseId) : null
      if (spouse && !done.has(spouse.id)) {
        ordered.push(spouse); done.add(spouse.id)
      }
    })
    byGen.set(g, ordered)
  })

  // Assign center-relative positions
  const positions = new Map<string, NodePos>()
  byGen.forEach((gp, gen) => {
    const rowW = gp.length * (CARD_W + H_GAP) - H_GAP
    gp.forEach((p, i) => {
      positions.set(p.id, {
        x: i * (CARD_W + H_GAP) - rowW / 2,
        y: gen * V_STEP,
      })
    })
  })

  return positions
}
