import type { DioramaSpec } from '../types'

// Thorntree — council estate on Middlesbrough's east side: terrace rows,
// the community hub and shops parade, the green, the beck at the flood edge.
export const thorntree: DioramaSpec = {
  elements: [
    { type: 'hills', items: [[-38, -30, 12, 8], [36, -32, 14, 6]] },
    // terrace rows (north side)
    ...[-32, -20, -8, 4].map((x) => ({
      type: 'building' as const, x, z: -16, w: 10, d: 5, h: 3, wall: '#C9A27E', roof: '#7A4A3A', roofH: 1.6,
    })),
    ...[-32, -20, -8].map((x) => ({
      type: 'building' as const, x, z: -24, w: 10, d: 5, h: 3, wall: '#BFA07E', roof: '#6E4A3A', roofH: 1.6,
    })),
    // community hub — big welcoming block on the green
    { type: 'building', x: -6, z: 8, w: 12, d: 7, h: 4.2, wall: '#E4CEB0', roof: '#12525F', roofH: 1.8, who: 'f76f8a11-8180-4430-8b17-8c4c6e42c93a' },
    { type: 'props', kind: 'flag', x: -6, z: 8, y: 6 },
    // shops parade (east)
    ...[0, 1, 2].map((i) => ({
      type: 'building' as const, x: 20 + i * 9, z: 2, w: 7, d: 5, h: 3.4, wall: '#D8CBB4', roof: '#5B4A3A', roofH: 1.4,
    })),
    { type: 'props', kind: 'stall', x: 24, z: 8, who: 'ed3443cc-0d12-4540-95a7-6b609b7cef9e' },
    // the green
    { type: 'tree', points: [[-14, 18, 1.1], [-4, 20, 1.3], [4, 16, 0.9], [-10, 26, 1], [6, 26, 1.2]] },
    { type: 'props', kind: 'bench', x: -4, z: 22 },
    { type: 'props', kind: 'bench', x: 2, z: 20, rot: 0.6 },
    // the beck — flood edge along the south
    { type: 'water-ribbon', points: [[-40, 30], [-24, 32], [-8, 30], [8, 33], [24, 31], [40, 34]], width: 2.2, who: '0a8f3374-845f-4084-a749-84f160867e4a' },
    { type: 'props', kind: 'sandbags', x: 10, z: 29, who: '0a8f3374-845f-4084-a749-84f160867e4a' },
    // council depot + housing foundations
    { type: 'building', x: 30, z: -18, w: 10, d: 6, h: 4, wall: '#D8E2EC', roof: '#3A5A8A', who: '83f27c1b-18d0-4921-851a-44d1a171e329' },
    { type: 'dashed', x: -24, z: 10, w: 4, d: 3.4 },
    { type: 'dashed', x: -19, z: 10.5, w: 4, d: 3.4 },
    { type: 'dashed', x: -24, z: 15, w: 4, d: 3.4 },
    // allotments
    { type: 'fields', x: -30, z: 24, strips: 4 },
  ],
  cast: [
    { story: '0292b7ec-293b-45f1-bd01-b8ab8ffd0ca4', label: 'Hub member', pos: [-8, 0, 12], top: '#006F84', skin: 0xf1c9a5, hair: 0x6b4423, ry: 0.9 },
    { story: '17afee61-52c0-433e-84b9-3e19dde4e866', label: 'Hub member', pos: [-4, 0, 11], top: '#3F5E8D', skin: 0xe0ac82, hair: 0x1b1b1b, style: 1, ry: 0.7 },
    { story: 'ed3443cc-0d12-4540-95a7-6b609b7cef9e', label: 'Ventures', pos: [22, 0, 10], top: '#6E4B00', skin: 0xc68642, hair: 0x3b2a1e, ry: 0.4 },
    { story: '1f0b8a9c-7877-41c5-95ab-05c1e55ef13f', label: 'Tool library', pos: [16, 0, 5], top: '#006425', skin: 0xffdbb4, hair: 0xd9c28c, tool: true, ry: 1.1 },
    { story: '0a8f3374-845f-4084-a749-84f160867e4a', label: 'Community plan', pos: [12, 0, 26], top: '#FCC30B', skin: 0xa9744f, hair: 0x2a2a2a, hat: '#FCC30B', ry: 0.9 },
    { story: 'f76f8a11-8180-4430-8b17-8c4c6e42c93a', label: 'Community hub', pos: [-2, 0, 14], top: '#12525F', skin: 0xf1c9a5, hair: 0xb5651d, ry: 0.8 },
    { story: 'b8aa84a9-8ca6-4917-8423-f14e4ace7296', label: 'Hub member', pos: [-10, 0, 16], top: '#7C6A93', skin: 0xffdbb4, hair: 0xe0e0e0, style: 2, ry: 0.8 },
    { story: '07dff937-10c9-460f-ac10-637b374c0ffe', label: 'Hub member', pos: [-6, 0, 19], top: '#A21942', skin: 0xe0ac82, hair: 0x6b4423, ry: 1.2 },
    { story: 'cb15a285-b7de-40a3-b425-260f8cd0a387', label: 'Council', pos: [28, 0, -14], top: '#00689D', skin: 0xe0ac82, hair: 0x3b2a1e, style: 3, ry: 0.8 },
    { story: '608a272a-0a6f-4b92-98a3-9ec39d2c1986', label: 'NE Bylines', pos: [30, 0, 4], top: '#544F4A', skin: 0xf1c9a5, hair: 0x1b1b1b, ry: 0.5 },
    { story: '83f27c1b-18d0-4921-851a-44d1a171e329', label: 'Council', pos: [32, 0, -12], top: '#3F5E8D', skin: 0xc68642, hair: 0x2a2a2a, ry: 0.9 },
    { story: 'c9f37124-5c6e-4cd4-b3ae-dc4d356e245d', label: 'Council', pos: [26, 0, -14], top: '#5B4A3A', skin: 0xffdbb4, hair: 0xd9c28c, ry: 1 },
    { story: 'e4817621-413e-40d5-9cf2-c19f539aa30e', label: 'Teesside Live', pos: [34, 0, 8], top: '#902824', skin: 0xf1c9a5, hair: 0x6b4423, ry: 0.6 },
    { story: '5191dadc-3479-46d0-85e9-b6a88bdf4509', label: 'Community plan', pos: [16, 0, 27], top: '#FCC30B', skin: 0x8d5524, hair: 0x1b1b1b, hat: '#FCC30B', ry: 0.7 },
    { story: '0220e67c-564d-4d55-acd2-14c3323bc356', label: 'Community plan', pos: [8, 0, 28], top: '#006F84', skin: 0xe0ac82, hair: 0x3b2a1e, ry: 1 },
    { story: '38eedfb2-2d2a-4e3c-86bd-89c75a8e43af', label: 'Community plan', pos: [-2, 0, 27], top: '#4C7A4C', skin: 0xa9744f, hair: 0x2a2a2a, ry: 0.9 },
    { story: '502e3022-38f5-4b5f-85a6-0361e4d2d154', label: 'Teesside Live', pos: [36, 0, 6], top: '#902824', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.5 },
    { story: '26c92dac-c177-4c9a-88e0-1998b45dad60', label: 'Resident voice', pos: [-12, 0, 6], top: '#26BDE2', skin: 0xf1c9a5, hair: 0xd9c28c, style: 1, ry: 0.9 },
    { story: '208af57c-bdde-45f7-b348-40a2b45dcac0', label: 'Teesside Live', pos: [33, 0, 10], top: '#6E4B00', skin: 0xe0ac82, hair: 0x3b2a1e, ry: 0.4 },
    { story: 'e5dccec5-3692-420e-a037-c961ce08b194', label: 'Resident voice', pos: [-16, 0, 12], top: '#FD6925', skin: 0xc68642, hair: 0x1b1b1b, style: 0, ry: 0.8 },
    { story: 'f8b58cb8-608e-4402-8895-8ee7e91e2e4a', label: 'The Athletic', pos: [36, 0, 12], top: '#3F5E8D', skin: 0xffdbb4, hair: 0x6b4423, ry: 0.6 },
    { story: 'c7cf5b35-4664-4b7e-adf0-74e40462f2fd', label: 'The Guardian', pos: [31, 0, 12], top: '#12525F', skin: 0xf1c9a5, hair: 0x2a2a2a, ry: 0.7 },
  ],
}
