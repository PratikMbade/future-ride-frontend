/* eslint-disable @typescript-eslint/consistent-generic-constructors */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  Background,
  BackgroundVariant,
  type NodeProps,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type SmoothStepPathOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── brand colours — dark blue / sky blue, no gold ───────────────
const SKY    = '#38BDF8'; // bright sky blue — primary accent, root, active text
const DEEP   = '#3B82F6'; // deeper blue — secondary accent, ring gradients
const SKY70  = 'rgba(56,189,248,0.70)';
const SKY45  = 'rgba(56,189,248,0.45)';
const SKY25  = 'rgba(56,189,248,0.25)';
const SKY16  = 'rgba(56,189,248,0.16)';
const SKY10  = 'rgba(56,189,248,0.10)';
// light, high-contrast blue-white used for body text so it stays "clear" to read
const TEXT_BRIGHT = '#E0F2FE';
const TEXT_DIM     = 'rgba(224,242,254,0.75)';

// ─── device tiers ─────────────────────────────────────────
// Three tiers instead of a single mobile/desktop split — this is what
// was breaking the layout on tablets (it was silently reusing desktop
// sizing on a narrower screen, causing overlap).
type Device = 'mobile' | 'tablet' | 'desktop';
const getDevice = (w: number): Device => (w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');

interface SizeConfig {
  nodeW:      number;
  ava:        number; // avatar diameter, normal node
  avaRoot:    number; // avatar diameter, root node
  gapY:       number; // vertical spacing between levels
  leafGap:    number; // horizontal spacing between adjacent leaf centres
  height:     number; // canvas height
  fitPad:     number; // react-flow fitView padding
  addrFont:   number;
  badgeFont:  number;
  edgeRadius: number; // smoothstep corner radius — 0 = sharp elbow
  minZoom:    number;
  maxZoom:    number;
}

// leafGap is always a fixed multiple of nodeW so horizontal spacing scales
// with node size and never overlaps, on any screen.
// Mobile/tablet get extra gapY + fitPad headroom and a tiny corner radius
// on the connectors — at small scale a perfectly sharp 90° elbow sitting
// right above an avatar reads as broken/misaligned; this gives it room.
const SIZES: Record<Device, SizeConfig> = {
  desktop: { nodeW:152, ava:86, avaRoot:98, gapY:200, leafGap:152*1.35, height:790, fitPad:0.13, addrFont:12, badgeFont:10, edgeRadius:0, minZoom:0.1,  maxZoom:2   },
  tablet:  { nodeW:118, ava:68, avaRoot:78, gapY:190, leafGap:118*1.35, height:680, fitPad:0.10, addrFont:11, badgeFont:10, edgeRadius:3, minZoom:0.5,  maxZoom:2.5 },
  mobile:  { nodeW:94,  ava:58, avaRoot:66, gapY:165, leafGap:94*1.35,  height:600, fitPad:0.09, addrFont:10, badgeFont:9,  edgeRadius:4, minZoom:0.4,  maxZoom:2.5 },
};

// ─── X centres, derived bottom-up so the tree is always symmetric ──
function buildCenters(leafGap: number) {
  const rootCenter = leafGap * 4; // guarantees every coordinate stays positive
  const leaves = Array.from({ length: 8 }, (_, i) => rootCenter + (i - 3.5) * leafGap);
  const lvl3   = [0, 2, 4, 6].map(i => (leaves[i] + leaves[i + 1]) / 2); // ll, lr, rl, rr
  const lvl2   = [0, 2].map(i => (lvl3[i] + lvl3[i + 1]) / 2);           // left, right
  const root   = (lvl2[0] + lvl2[1]) / 2;

  return {
    root,
    left: lvl2[0], right: lvl2[1],
    ll: lvl3[0], lr: lvl3[1], rl: lvl3[2], rr: lvl3[3],
    lll: leaves[0], llr: leaves[1],
    lrl: leaves[2], lrr: leaves[3],
    rll: leaves[4], rlr: leaves[5],
    rrl: leaves[6], rrr: leaves[7],
  } as const;
}

const CENTERS: Record<Device, ReturnType<typeof buildCenters>> = {
  desktop: buildCenters(SIZES.desktop.leafGap),
  tablet:  buildCenters(SIZES.tablet.leafGap),
  mobile:  buildCenters(SIZES.mobile.leafGap),
};

// Single, flat node style — no per-level rainbow, just the sky-blue accent.
function nodeStyle() {
  return { bg: SKY16, border: SKY45, text: SKY };
}

// ─── types ────────────────────────────────────────────────
interface TreeNode {
  id:              string;
  address:         string;
  referralAddress: string;
  contractRegId:   number;
  isRegistered:    boolean;
  absoluteLevel?:  number;
  level?:          number;
  left?:           TreeNode | null;
  right?:          TreeNode | null;
}

interface MemberNodeData extends Record<string, unknown> {
  treeNodeId:      string;
  address:         string;
  referralAddress: string;
  contractRegId:   number | null;
  isRegistered:    boolean;
  displayLevel:    number;
  isEmpty:         boolean;
  isRoot:          boolean;
  device:          Device;
}

// ─── assign absolute levels once on the full tree ────────
function assignAbsoluteLevels(node: TreeNode, level = 0): TreeNode {
  return {
    ...node,
    absoluteLevel: level,
    left:  node.left  ? assignAbsoluteLevels(node.left,  level + 1) : node.left,
    right: node.right ? assignAbsoluteLevels(node.right, level + 1) : node.right,
  };
}

// ─── mock data (4 levels deep: ids 1 → 15) ───────
const RAW_TREE: TreeNode = {
  id:'1', address:'0xA302...Da501', referralAddress:'0xA302...Da501', contractRegId:1, isRegistered:true,
  left:{
    id:'2', address:'0xC548...Af6bE', referralAddress:'0xA302...Da501', contractRegId:2, isRegistered:true,
    left:{
      id:'4', address:'0xF1A2...B3C4', referralAddress:'0xC548...Af6bE', contractRegId:4, isRegistered:true,
      left: {id:'8',  address:'0x8B2C...D4E5', referralAddress:'0xF1A2...B3C4', contractRegId:8,  isRegistered:true,  left:null, right:null},
      right:{id:'9',  address:'0x9C3D...E5F6', referralAddress:'0xF1A2...B3C4', contractRegId:9,  isRegistered:true,  left:null, right:null},
    },
    right:{
      id:'5', address:'0xA2B3...C4D5', referralAddress:'0xC548...Af6bE', contractRegId:5, isRegistered:true,
      left: {id:'10', address:'0x1D4E...F607', referralAddress:'0xA2B3...C4D5', contractRegId:10, isRegistered:false, left:null, right:null},
      right:{id:'11', address:'0x2E5F...0718', referralAddress:'0xA2B3...C4D5', contractRegId:11, isRegistered:true,  left:null, right:null},
    },
  },
  right:{
    id:'3', address:'0xD912...Cc3F', referralAddress:'0xA302...Da501', contractRegId:3, isRegistered:true,
    left:{
      id:'6', address:'0xB3C4...D5E6', referralAddress:'0xD912...Cc3F', contractRegId:6, isRegistered:true,
      left: {id:'12', address:'0x3F60...1829', referralAddress:'0xB3C4...D5E6', contractRegId:12, isRegistered:true,  left:null, right:null},
      right:{id:'13', address:'0x4071...293A', referralAddress:'0xB3C4...D5E6', contractRegId:13, isRegistered:false, left:null, right:null},
    },
    right:{
      id:'7', address:'0xC4D5...E6F7', referralAddress:'0xD912...Cc3F', contractRegId:7, isRegistered:true,
      left: {id:'14', address:'0x5182...3A4B', referralAddress:'0xC4D5...E6F7', contractRegId:14, isRegistered:true,  left:null, right:null},
      right:{id:'15', address:'0x6293...4B5C', referralAddress:'0xC4D5...E6F7', contractRegId:15, isRegistered:false, left:null, right:null},
    },
  },
};
const MOCK_TREE = assignAbsoluteLevels(RAW_TREE);

function flattenTree(n: TreeNode, m: Map<string,TreeNode> = new Map()): Map<string,TreeNode> {
  m.set(n.id, n);
  if (n.left)  flattenTree(n.left,  m);
  if (n.right) flattenTree(n.right, m);
  return m;
}
const NODE_MAP = flattenTree(MOCK_TREE);

// ─── build graph — 4 levels, orthogonal "elbow" connectors ───────
function buildGraph(root: TreeNode, device: Device): { nodes: Node[]; edges: Edge[] } {
  const cfg = SIZES[device];
  const CX  = CENTERS[device];

  const OFFSET_Y = device === 'desktop' ? 0 : -10;
  const LEVEL_Y = {
    1: OFFSET_Y,
    2: OFFSET_Y + cfg.gapY,
    3: OFFSET_Y + cfg.gapY * 2,
    4: OFFSET_Y + cfg.gapY * 3,
  } as const;

  const toPos = (cx: number, lvl: 1|2|3|4) => ({ x: cx - cfg.nodeW / 2, y: LEVEL_Y[lvl] });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const mkNode = (
    id: string, cx: number, layoutLvl: 1|2|3|4,
    data: TreeNode|null|undefined, isRoot = false
  ): Node<MemberNodeData> => ({
    id, type:'member',
    position: toPos(cx, layoutLvl),
    width: cfg.nodeW,
    data: data
      ? {
          treeNodeId:      data.id,
          address:         data.address,
          referralAddress: data.referralAddress,
          contractRegId:   data.contractRegId,
          isRegistered:    data.isRegistered,
          displayLevel:    data.absoluteLevel ?? 0,
          isEmpty: false,
          isRoot,
          device,
        }
      : {
          treeNodeId:'', address:'', referralAddress:'',
          contractRegId:null, isRegistered:false,
          displayLevel: (root.absoluteLevel ?? 0) + layoutLvl - 1,
          isEmpty:true, isRoot:false, device,
        },
    draggable:false, selectable:false,
  });

  // Orthogonal "elbow" connector — sharp right angles on desktop; mobile
  // and tablet get a small corner radius (cfg.edgeRadius) since a hard 90°
  // bend right above a small avatar reads as broken at that scale.
  const mkEdge = (src: string, tgt: string): Edge & { pathOptions?: SmoothStepPathOptions } => ({
    id:`${src}→${tgt}`, source:src, target:tgt,
    sourceHandle:'bot', targetHandle:'top',
    type:'smoothstep',
    pathOptions:{ borderRadius:cfg.edgeRadius },
    style:{ stroke: SKY45, strokeWidth:2 },
  });

  nodes.push(mkNode('root', CX.root, 1, root, true));

  nodes.push(mkNode('left',  CX.left,  2, root.left));
  nodes.push(mkNode('right', CX.right, 2, root.right));
  edges.push(mkEdge('root','left'));
  edges.push(mkEdge('root','right'));

  nodes.push(mkNode('ll', CX.ll, 3, root.left?.left));
  nodes.push(mkNode('lr', CX.lr, 3, root.left?.right));
  nodes.push(mkNode('rl', CX.rl, 3, root.right?.left));
  nodes.push(mkNode('rr', CX.rr, 3, root.right?.right));
  if (root.left)  { edges.push(mkEdge('left','ll'));  edges.push(mkEdge('left','lr')); }
  if (root.right) { edges.push(mkEdge('right','rl')); edges.push(mkEdge('right','rr')); }

  nodes.push(mkNode('lll', CX.lll, 4, root.left?.left?.left));
  nodes.push(mkNode('llr', CX.llr, 4, root.left?.left?.right));
  nodes.push(mkNode('lrl', CX.lrl, 4, root.left?.right?.left));
  nodes.push(mkNode('lrr', CX.lrr, 4, root.left?.right?.right));
  nodes.push(mkNode('rll', CX.rll, 4, root.right?.left?.left));
  nodes.push(mkNode('rlr', CX.rlr, 4, root.right?.left?.right));
  nodes.push(mkNode('rrl', CX.rrl, 4, root.right?.right?.left));
  nodes.push(mkNode('rrr', CX.rrr, 4, root.right?.right?.right));
  if (root.left?.left)   { edges.push(mkEdge('ll','lll')); edges.push(mkEdge('ll','llr')); }
  if (root.left?.right)  { edges.push(mkEdge('lr','lrl')); edges.push(mkEdge('lr','lrr')); }
  if (root.right?.left)  { edges.push(mkEdge('rl','rll')); edges.push(mkEdge('rl','rlr')); }
  if (root.right?.right) { edges.push(mkEdge('rr','rrl')); edges.push(mkEdge('rr','rrr')); }

  return { nodes, edges };
}

// ─── generic user-avatar icon ─────────────────────────────
const UserAvatarIcon = ({ size, color, glow }: { size:number; color:string; glow:string }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ filter:`drop-shadow(0 0 5px ${glow})`, position:'relative', zIndex:1 }}
  >
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.7"/>
    <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

// ─── node component ───────────────────────────────────────
const HS = { opacity:0, width:1, height:1, minWidth:1, minHeight:1, background:'transparent', border:'none' };

const MemberNode = ({ data }: NodeProps<Node<MemberNodeData>>) => {
  const { address, contractRegId, isEmpty, isRoot, displayLevel, device } = data;
  const cfg   = SIZES[device as Device];
  const style = nodeStyle();
  const NW    = cfg.nodeW;
  const AVA   = isRoot ? cfg.avaRoot : cfg.ava;

  if (isEmpty) {
    return (
      <div style={{ width:NW, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        <Handle id="top" type="target" position={Position.Top}    style={HS}/>
        <div style={{
          width:cfg.ava, height:cfg.ava, borderRadius:'50%',
          border:'1.5px dashed rgba(56,189,248,0.28)',
          background:'rgba(56,189,248,0.04)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ color:'rgba(56,189,248,0.45)', fontSize:cfg.ava*0.32, lineHeight:1 }}>+</span>
        </div>
        <span style={{
          background:style.bg, border:`1px solid ${style.border}`,
          borderRadius:4, padding:'2px 7px',
          color:style.text, fontSize:cfg.badgeFont, fontFamily:'Chivo Mono,monospace', fontWeight:600,
        }}>
          L{displayLevel as number}
        </span>
        <Handle id="bot" type="source" position={Position.Bottom} style={HS}/>
      </div>
    );
  }

  return (
    <div style={{ width:NW, display:'flex', flexDirection:'column', alignItems:'center', gap:7, cursor:'pointer' }}>
      <Handle id="top" type="target" position={Position.Top} style={HS}/>

      <div style={{
        position:'relative',
        width:  AVA + (isRoot ? 10 : 0),
        height: AVA + (isRoot ? 10 : 0),
        borderRadius:'50%',
        padding: isRoot ? 3 : 2,
        background: isRoot
          ? `conic-gradient(${SKY}, ${DEEP}, ${SKY})`
          : 'rgba(56,189,248,0.22)',
        boxShadow: isRoot
          ? `0 0 0 1px ${SKY45}, 0 0 30px ${SKY25}, 0 0 60px rgba(56,189,248,0.12)`
          : '0 0 0 1px rgba(56,189,248,0.25)',
        flexShrink:0,
      }}>
        <div style={{
          width:'100%', height:'100%', borderRadius:'50%',
          background:'rgba(4,10,26,0.94)',
          display:'flex', alignItems:'center', justifyContent:'center',
          overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background: isRoot ? `radial-gradient(circle, ${SKY10} 0%, transparent 70%)` : 'none',
          }}/>
          <UserAvatarIcon
            size={AVA * (isRoot ? 0.46 : 0.42)}
            color={isRoot ? SKY : TEXT_DIM}
            glow={isRoot ? 'rgba(56,189,248,0.65)' : 'rgba(56,189,248,0.3)'}
          />
        </div>
      </div>

      <span style={{
        color: isRoot ? SKY : TEXT_BRIGHT,
        fontSize: cfg.addrFont,
        fontFamily:'Chivo Mono,monospace',
        fontWeight: isRoot ? 700 : 500,
        textAlign:'center', lineHeight:1.3,
        maxWidth: NW, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>
        {address}
      </span>

      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {contractRegId != null && (
          <span style={{
            background:'rgba(56,189,248,0.10)', border:'1px solid rgba(56,189,248,0.28)',
            borderRadius:4, padding:'2px 6px',
            color:TEXT_DIM, fontSize:cfg.badgeFont, fontFamily:'Chivo Mono,monospace',
          }}>
            #{contractRegId}
          </span>
        )}
        <span style={{
          background:style.bg, border:`1px solid ${style.border}`,
          borderRadius:4, padding:'2px 6px',
          color:style.text, fontSize:cfg.badgeFont, fontFamily:'Chivo Mono,monospace', fontWeight:700,
        }}>
          L{displayLevel as number}
        </span>
      </div>

      <Handle id="bot" type="source" position={Position.Bottom} style={HS}/>
    </div>
  );
};

const nodeTypes = { member: MemberNode };

// ─── touch tap panel (mobile + tablet) ────────────────────
const TapPanel = ({ node, onClose }: { node: TreeNode; onClose: () => void }) => {
  const style = nodeStyle();
  return (
    <div
      style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:9999,
        background:'rgba(4,10,26,0.97)',
        border:'1px solid rgba(56,189,248,0.32)',
        borderRadius:'16px 16px 0 0',
        padding:'18px',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.9)',
        backdropFilter:'blur(20px)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
        <div style={{ width:36, height:3, borderRadius:999, background:'rgba(56,189,248,0.3)' }}/>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:12, borderBottom:'1px solid rgba(56,189,248,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <UserAvatarIcon size={18} color={SKY} glow="rgba(56,189,248,0.6)"/>
          <span style={{ color:SKY, fontSize:11, fontFamily:'Chivo Mono,monospace', letterSpacing:'0.1em', fontWeight:700 }}>NODE INFO</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            background:style.bg, border:`1px solid ${style.border}`,
            borderRadius:20, padding:'3px 11px',
            color:style.text, fontSize:10, fontFamily:'Chivo Mono,monospace', fontWeight:700,
          }}>
            Level {node.absoluteLevel ?? 0}
          </span>
          <button
            onClick={onClose}
            style={{
              background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)',
              borderRadius:6, color:'rgba(255,255,255,0.7)', fontSize:16,
              width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', lineHeight:1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {([
        ['ID',       `#${node.contractRegId}`],
        ['Address',  node.address],
        ['Referral', node.referralAddress],
        ['Status',   node.isRegistered ? '● Active' : '○ Inactive'],
      ] as [string,string][]).map(([label, value]) => (
        <div key={label} style={{ display:'flex', gap:12, marginBottom:9, alignItems:'flex-start' }}>
          <span style={{ color:'rgba(56,189,248,0.5)', fontSize:11, fontFamily:'Chivo Mono,monospace', minWidth:60, flexShrink:0, paddingTop:1, fontWeight:600 }}>
            {label}
          </span>
          <span style={{
            color: label === 'Status'
              ? (node.isRegistered ? '#17c964' : '#f31260')
              : TEXT_BRIGHT,
            fontSize:12, fontFamily:'Chivo Mono,monospace', lineHeight:1.5, wordBreak:'break-all',
          }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── cursor tooltip (desktop only) ───────────────────────
interface CursorPos { x:number; y:number }

const CursorTooltip = ({ node, cursor, containerRef }: {
  node: TreeNode;
  cursor: CursorPos;
  containerRef: React.RefObject<HTMLDivElement|null>;
}) => {
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return null;
  const rx   = cursor.x - rect.left;
  const ry   = cursor.y - rect.top;
  const TW   = 270;
  const left = rx + TW + 20 > rect.width ? rx - TW - 14 : rx + 16;
  const top  = Math.max(8, Math.min(ry - 10, rect.height - 210));
  const style = nodeStyle();

  return (
    <div style={{
      position:'absolute', left, top, width:TW, zIndex:9999, pointerEvents:'none',
      background:'rgba(4,10,26,0.97)',
      border:`1px solid ${SKY45}`,
      borderRadius:12, padding:'14px 17px',
      boxShadow:`0 0 0 1px rgba(56,189,248,0.08), 0 8px 32px rgba(0,0,0,0.85), 0 0 26px ${SKY10}`,
      backdropFilter:'blur(16px)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11, paddingBottom:9, borderBottom:'1px solid rgba(56,189,248,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <UserAvatarIcon size={15} color={SKY} glow="rgba(56,189,248,0.6)"/>
          <span style={{ color:SKY, fontSize:10, fontFamily:'Chivo Mono,monospace', letterSpacing:'0.12em', fontWeight:700 }}>NODE INFO</span>
        </div>
        <span style={{
          background:style.bg, border:`1px solid ${style.border}`,
          borderRadius:20, padding:'2px 9px',
          color:style.text, fontSize:10, fontFamily:'Chivo Mono,monospace', fontWeight:700,
        }}>
          Level {node.absoluteLevel ?? 0}
        </span>
      </div>

      {([
        ['ID',       `#${node.contractRegId}`],
        ['Address',  node.address],
        ['Referral', node.referralAddress],
        ['Status',   node.isRegistered ? '● Active' : '○ Inactive'],
      ] as [string,string][]).map(([label, value]) => (
        <div key={label} style={{ display:'flex', gap:10, marginBottom:7, alignItems:'flex-start' }}>
          <span style={{ color:'rgba(56,189,248,0.45)', fontSize:10, fontFamily:'Chivo Mono,monospace', minWidth:56, flexShrink:0, paddingTop:1, fontWeight:600 }}>
            {label}
          </span>
          <span style={{
            color: label === 'Status'
              ? (node.isRegistered ? '#17c964' : '#f31260')
              : TEXT_BRIGHT,
            fontSize:11, fontFamily:'Chivo Mono,monospace', lineHeight:1.4, wordBreak:'break-all',
          }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── breadcrumb ───────────────────────────────────────────
const Breadcrumb = ({ trail, onJump }: { trail:TreeNode[]; onJump:(i:number)=>void }) => {
  const style = nodeStyle();
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', marginBottom:12 }}>
      {trail.map((node, i) => {
        const isActive = i === trail.length - 1;
        return (
          <div key={node.id} style={{ display:'flex', alignItems:'center', gap:5 }}>
            {i > 0 && <span style={{ color:'rgba(56,189,248,0.35)', fontSize:13 }}>›</span>}
            <button onClick={() => onJump(i)} style={{
              display:'flex', alignItems:'center', gap:6,
              background: isActive ? 'rgba(56,189,248,0.10)' : 'transparent',
              border:`1px solid ${isActive ? SKY45 : 'rgba(56,189,248,0.18)'}`,
              borderRadius:6,
              color: isActive ? SKY : TEXT_DIM,
              fontSize:11, fontFamily:'Chivo Mono,monospace', fontWeight:600, padding:'4px 9px',
              cursor: isActive ? 'default' : 'pointer',
            }}>
              {i === 0 && <span>⌂</span>}
              <span>{i === 0 ? 'Root' : node.address}</span>
              <span style={{
                background:style.bg, border:`1px solid ${style.border}`,
                borderRadius:3, padding:'0px 5px',
                color:style.text, fontSize:9, fontFamily:'Chivo Mono,monospace',
              }}>
                L{node.absoluteLevel ?? 0}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ─── flow wrapper ─────────────────────────────────────────
const TreeFlow = ({
  root, hoveredNode, cursor, containerRef,
  onNodeClick, onNodeEnter, onNodeLeave,
  device,
}: {
  root:        TreeNode;
  hoveredNode: TreeNode | null;
  cursor:      CursorPos;
  containerRef:React.RefObject<HTMLDivElement|null>;
  onNodeClick: (id:string)=>void;
  onNodeEnter: (id:string)=>void;
  onNodeLeave: ()=>void;
  device:      Device;
}) => {
  const { nodes, edges } = useMemo(() => buildGraph(root, device), [root, device]);
  const cfg = SIZES[device];

  const handleClick: NodeMouseHandler = useCallback((_e,n) => {
    const d = n.data as MemberNodeData;
    if (!d.isEmpty && d.treeNodeId) onNodeClick(d.treeNodeId);
  }, [onNodeClick]);

  const handleEnter: NodeMouseHandler = useCallback((_e,n) => {
    const d = n.data as MemberNodeData;
    if (!d.isEmpty && d.treeNodeId) onNodeEnter(d.treeNodeId);
  }, [onNodeEnter]);

  const handleLeave: NodeMouseHandler = useCallback(() => onNodeLeave(), [onNodeLeave]);

  return (
    <div ref={containerRef} style={{
      width:'100%', height:cfg.height, borderRadius:14, overflow:'hidden', position:'relative',
      background:'#020817',
      border:'1px solid rgba(56,189,248,0.16)',
      boxShadow:'0 0 0 1px rgba(56,189,248,0.05), inset 0 0 100px rgba(0,0,0,0.9)',
    }}>
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: cfg.fitPad }}
        nodesDraggable={false} nodesConnectable={false}
        elementsSelectable={false}
        // Desktop stays fixed (untouched, as requested). Mobile + tablet
        // get pan and pinch/scroll/double-click zoom so the tree can be
        // explored on a small screen.
        panOnDrag={device !== 'desktop'}
        zoomOnScroll={device !== 'desktop'}
        zoomOnPinch={device !== 'desktop'}
        zoomOnDoubleClick={device !== 'desktop'}
        minZoom={cfg.minZoom}
        maxZoom={cfg.maxZoom}
        proOptions={{ hideAttribution:true }}
        onNodeClick={handleClick}
        onNodeMouseEnter={handleEnter}
        onNodeMouseLeave={handleLeave}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="rgba(56,189,248,0.09)"/>
      </ReactFlow>

      {device === 'desktop' && hoveredNode && (
        <CursorTooltip node={hoveredNode} cursor={cursor} containerRef={containerRef}/>
      )}
    </div>
  );
};

// ─── legend ───────────────────────────────────────────────
const LevelLegend = ({ rootLevel }: { rootLevel: number }) => {
  const style = nodeStyle();
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:14, flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <span style={{
          background:style.bg, border:`1px solid ${style.border}`,
          borderRadius:4, padding:'2px 8px',
          color:style.text, fontSize:11, fontFamily:'Chivo Mono,monospace', fontWeight:700,
        }}>
          L{rootLevel}
        </span>
        <span style={{ color:TEXT_DIM, fontSize:11, fontFamily:'Chivo Mono,monospace' }}>
          Current view root — 4 generations shown below it
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <div style={{ width:14, height:14, borderRadius:'50%', border:'1.5px dashed rgba(56,189,248,0.28)', flexShrink:0 }}/>
        <span style={{ color:'rgba(56,189,248,0.45)', fontSize:11, fontFamily:'Chivo Mono,monospace' }}>Empty slot</span>
      </div>
    </div>
  );
};

// ─── main ─────────────────────────────────────────────────
export const GenerationTree = () => {
  const [trail,       setTrail]       = useState<TreeNode[]>([MOCK_TREE]);
  const [hoveredNode, setHoveredNode] = useState<TreeNode | null>(null);
  const [tappedNode,  setTappedNode]  = useState<TreeNode | null>(null);
  const [cursor,      setCursor]      = useState<CursorPos>({ x:0, y:0 });
  const [device,      setDevice]      = useState<Device>(() => globalThis.window === undefined ? 'desktop' : getDevice(window.innerWidth));
  const containerRef = useRef<HTMLDivElement|null>(null);
  const currentRoot  = trail[trail.length - 1];
  const isTouch = device !== 'desktop'; // tablets behave like mobile (tap, not hover)

  useEffect(() => {
    const fn = () => setDevice(getDevice(window.innerWidth));
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setCursor({ x: e.clientX, y: e.clientY });
  }, []);

  const handleNodeClick = useCallback((id: string) => {
    const n = NODE_MAP.get(id);
    if (!n) return;

    if (isTouch) {
      if (tappedNode?.id === id) {
        if (n.id !== currentRoot.id) {
          setTrail(prev => [...prev, n]);
          setTappedNode(null);
        }
      } else {
        setTappedNode(n);
      }
    } else {
      if (n.id !== currentRoot.id) {
        setTrail(prev => [...prev, n]);
        setHoveredNode(null);
      }
    }
  }, [isTouch, tappedNode, currentRoot]);

  const handleNodeEnter = useCallback((id: string) => {
    if (!isTouch) setHoveredNode(NODE_MAP.get(id) ?? null);
  }, [isTouch]);

  const handleNodeLeave = useCallback(() => {
    if (!isTouch) setHoveredNode(null);
  }, [isTouch]);

  const handleJump = useCallback((i: number) => {
    setTrail(prev => prev.slice(0, i + 1));
    setHoveredNode(null);
    setTappedNode(null);
  }, []);

  const rootLevel = currentRoot.absoluteLevel ?? 0;
  const style = nodeStyle();

  return (
    <div
      style={{ padding: device === 'desktop' ? '1.5rem' : '1.1rem', background:'#020817', minHeight:'100vh' }}
      onMouseMove={handleMouseMove}
      onClick={() => { if (isTouch) setTappedNode(null); }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
          <UserAvatarIcon size={20} color={SKY} glow="rgba(56,189,248,0.7)"/>
          <span style={{ color:SKY, fontSize:13, fontFamily:'Chivo Mono,monospace', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 }}>
            Generation Tree
          </span>
          <span style={{
            background: style.bg,
            border:`1px solid ${style.border}`,
            borderRadius:20, padding:'2px 10px',
            color: style.text,
            fontSize:10, fontFamily:'Chivo Mono,monospace', fontWeight:700,
          }}>
            Viewing from L{rootLevel}
          </span>
        </div>
        {trail.length > 1 && (
          <button
            onClick={() => { setTrail([MOCK_TREE]); setHoveredNode(null); setTappedNode(null); }}
            style={{
              background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.28)',
              borderRadius:6, color:SKY70, fontSize:11, fontWeight:600,
              fontFamily:'Chivo Mono,monospace', padding:'4px 11px', cursor:'pointer',
            }}
          >
            ↩ Reset
          </button>
        )}
      </div>

      {trail.length > 1 && <Breadcrumb trail={trail} onJump={handleJump}/>}

      <p style={{ color:TEXT_DIM, fontSize:11, fontFamily:'Chivo Mono,monospace', marginBottom:12 }}>
        {isTouch
          ? 'Tap any node to inspect · Tap again to drill down'
          : 'Click any node to drill into its subtree · Hover to inspect'}
      </p>

      <ReactFlowProvider>
        <TreeFlow
          root={currentRoot}
          hoveredNode={hoveredNode}
          cursor={cursor}
          containerRef={containerRef}
          onNodeClick={handleNodeClick}
          onNodeEnter={handleNodeEnter}
          onNodeLeave={handleNodeLeave}
          device={device}
        />
      </ReactFlowProvider>

      {isTouch && tappedNode && (
        <TapPanel node={tappedNode} onClose={() => setTappedNode(null)} />
      )}

      <LevelLegend rootLevel={rootLevel}/>
    </div>
  );
};