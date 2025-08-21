export type Vec2 = { x: number; y: number };

export type Linker ={
  id: string;
  pos: Vec2;
  input: string;
  output: string
}
export type NodeData = {
  id: string;
  x: number; // world coords
  y: number; // world coords
  w: number;
  h: number;
  label: string;
  color: string;
  interfaces:Linker[]
};
export type Camera = { x: number; y: number; scale: number };