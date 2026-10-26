import type { PlaceId } from '../../lib'
import type { DioramaSpec } from '../types'
import { utopia } from './utopia'
import { thorntree } from './thorntree'
import { kenyaCoast } from './kenya-coast'
import { midaCreek } from './mida-creek'
import { hebdenBridge } from './hebden-bridge'
import { darEsSalaam } from './dar-es-salaam'
import { puertoLaCruz } from './puerto-la-cruz'
import { minneapolis } from './minneapolis'
import { nairobi } from './nairobi'
import { detroit } from './detroit'

// Authored scene data per place — plain objects, no three.js. Kept free of the
// heavy render deps so this map can live in the main chunk while Diorama
// (three + r3f) is lazy-loaded.
export const DIORAMAS: Record<PlaceId, DioramaSpec> = {
  thorntree,
  'kenya-coast': kenyaCoast,
  'mida-creek': midaCreek,
  'hebden-bridge': hebdenBridge,
  'dar-es-salaam': darEsSalaam,
  'puerto-la-cruz': puertoLaCruz,
  minneapolis,
  nairobi,
  detroit,
  utopia,
}
