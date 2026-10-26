import type { DioramaSpec } from '../types'

// Mida Creek — a tidal creek with mudflats, the boardwalk, mangrove belts,
// dabaso fishers' boats, conservation plots (planted vs dashed-out pending).
export const midaCreek: DioramaSpec = {
  elements: [
    // the creek — broad ribbon curving through
    { type: 'water-ribbon', points: [[-40, -8], [-28, -4], [-14, 2], [0, 8], [14, 14], [28, 20], [40, 24]], width: 6 },
    // mudflats either side of the channel
    { type: 'box', size: [30, 0.1, 6], color: '#B8A67E', pos: [-16, 0.08, 12] },
    { type: 'box', size: [22, 0.1, 5], color: '#B8A67E', pos: [18, 0.08, 26] },
    // the boardwalk over the mud
    ...[0, 1, 2, 3, 4, 5].map((i) => ({
      type: 'box' as const, size: [4, 0.18, 1.4] as [number, number, number], color: '#8A5A2B',
      pos: [-20 + i * 4.2, 0.5, 10 + i * 1.2] as [number, number, number], who: '13f1779a-b2e2-4545-acf8-a4abe521aa96',
    })),
    // mangrove belts on the creek edges
    { type: 'tree', points: [[-32, 2, 0.9], [-26, 4, 1], [-20, 6, 0.8], [-10, 12, 1], [-4, 16, 0.9], [4, 20, 1], [10, 22, 0.8], [22, 28, 1], [30, 30, 0.9], [36, 32, 1]] },
    { type: 'tree', points: [[-36, -14, 0.8], [-28, -12, 0.9], [-20, -8, 1], [-12, -4, 0.8], [-4, 0, 0.9], [8, 4, 0.8], [18, 10, 0.9]] },
    // dabaso fishers' boats
    { type: 'props', kind: 'boat', x: -8, z: 6, rot: 0.5, who: '0c455025-e644-4fc6-9fc1-81208a7a4e1b' },
    { type: 'props', kind: 'boat', x: 12, z: 16, rot: -0.4, who: '0c455025-e644-4fc6-9fc1-81208a7a4e1b' },
    // conservation office + county building
    { type: 'building', x: -24, z: -18, w: 8, d: 5, h: 3.6, wall: '#E4F0EA', roof: '#4C7A4C', who: '703be15d-2f24-422d-8e3b-a8d280df701c' },
    { type: 'building', x: 26, z: -18, w: 9, d: 6, h: 4.4, wall: '#D8E2EC', roof: '#3A5A8A', who: '24f93773-9f03-4465-9da7-dc1f26605aba' },
    { type: 'props', kind: 'flag', x: 29, z: -18, y: 6.4, who: '24f93773-9f03-4465-9da7-dc1f26605aba' },
    // planting plots: green (planted) vs dashed (pledged)
    { type: 'props', kind: 'garden', x: -32, z: 8, who: '94664281-4680-4921-aa18-15e8b48e59bf' },
    { type: 'props', kind: 'garden', x: -26, z: 10, who: 'f5fd9426-2569-40e2-b7ff-8337c74bd431' },
    { type: 'dashed', x: -20, z: 12, w: 5, d: 4 },
    { type: 'dashed', x: -14, z: 14, w: 5, d: 4 },
    // village bandas inland
    ...[0, 1, 2].map((i) => ({
      type: 'building' as const, x: -2 + i * 9, z: -20 - (i % 2) * 6, w: 6, d: 5, h: 2.8, wall: '#E4CEB0', roof: '#8A5A2B', roofH: 2,
    })),
    { type: 'pond', x: 8, z: -16, r: 1.4 },
  ],
  cast: [
    { story: '13f1779a-b2e2-4545-acf8-a4abe521aa96', label: 'Conservation', pos: [-18, 0, 8], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, hat: '#006425', ry: 0.8 },
    { story: '9dd2b502-6e5f-4078-ae29-e96c5d405973', label: 'Conservation', pos: [-14, 0, 6], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: 'cf830a51-b3b3-4e59-bd07-dbdf8e01bb2f', label: 'Conservation', pos: [-22, 0, 10], top: '#4C7A4C', skin: 0xc68642, hair: 0x2a2a2a, ry: 0.8 },
    { story: 'c03a3fc0-e0c9-4a1d-90b1-1daaf69dfac9', label: 'Conservation', pos: [-16, 0, 12], top: '#006F84', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: 'a8cdcc9a-2896-4bcc-9e7b-20d0d49e0b2b', label: 'Conservation', pos: [-26, 0, 8], top: '#3F5E8D', skin: 0x8d5524, hair: 0x1b1b1b, ry: 1 },
    { story: '0c455025-e644-4fc6-9fc1-81208a7a4e1b', label: 'Dabaso fishers', pos: [-6, 0, 4], top: '#00689D', skin: 0x8d5524, hair: 0x1b1b1b, tool: true, ry: 0.6 },
    { story: 'cc6e4ba7-8080-47a7-98e0-b8887e9636d5', label: 'Conservation', pos: [-20, 0, 14], top: '#006425', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.9 },
    { story: '24f93773-9f03-4465-9da7-dc1f26605aba', label: 'Kilifi County', pos: [24, 0, -14], top: '#00689D', skin: 0x8d5524, hair: 0x1b1b1b, style: 3, ry: 0.8 },
    { story: '3ef60c8e-ca49-40a2-bb66-1ca5e9500fc7', label: 'Kilifi County', pos: [28, 0, -14], top: '#3F5E8D', skin: 0xc68642, hair: 0x1b1b1b, style: 3, ry: 0.7 },
    { story: '703be15d-2f24-422d-8e3b-a8d280df701c', label: 'Mida Creek Cons.', pos: [-24, 0, -14], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '44d09046-d29f-468b-934a-3e0500ad969e', label: 'Mida Creek Cons.', pos: [-27, 0, -14], top: '#4C7A4C', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: 'b8cb6e3a-f9be-405d-b19b-eeeb26de89db', label: 'Mida Creek Cons.', pos: [-21, 0, -14], top: '#12525F', skin: 0x8d5524, hair: 0x1b1b1b, ry: 1 },
    { story: 'e84b456a-b46a-4171-b22f-bf7d7970ac4a', label: 'Mida Creek Cons.', pos: [-18, 0, -16], top: '#006425', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.8 },
    { story: '4808b88a-8be2-4b54-8385-b62922826ba8', label: 'Regen network', pos: [4, 0, -18], top: '#26BDE2', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '1014c73f-3e97-4737-8dfd-17536e2a284b', label: 'Regen network', pos: [8, 0, -20], top: '#FD6925', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.9 },
    { story: 'f5fd9426-2569-40e2-b7ff-8337c74bd431', label: 'Treegens team', pos: [-30, 0, 12], top: '#6E9B6B', skin: 0x8d5524, hair: 0x1b1b1b, tool: true, ry: 0.8 },
    { story: '4b346be7-a3b3-4694-8d97-1806069dbc88', label: 'Treegens team', pos: [-34, 0, 10], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, tool: true, ry: 0.9 },
    { story: '94664281-4680-4921-aa18-15e8b48e59bf', label: 'Treegens team', pos: [-28, 0, 14], top: '#4C7A4C', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.7 },
    { story: '7c22971b-7f2f-48ef-9a14-4523bfaa3412', label: 'Treegens team', pos: [-24, 0, 12], top: '#006F84', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
  ],
}
