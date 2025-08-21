"use client";
import React, { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Color from "color";
import CanvasBoard from "@/components/CanvasBoard";
import InputBox, { ColorBox, PositionBox } from "@/components/InputBox";
import { Button } from "@/components/ui/button";
import { NodeData } from "@/lib/zod";
import { RgbaColorPicker } from "react-colorful";

const toRGBA = (c: string) => Color(c).alpha(0.12).rgb().string(); // keep one format
const rgbaToObject = (rgba: string) => {
  const color = Color(rgba);
  return { r: color.red(), g: color.green(), b: color.blue(), a: color.alpha() }
}

const initialNodes: NodeData[] = [
  { id: "a", x: 0, y: 0, w: 250, h: 100, label: "Node A", color: toRGBA("#ff0000"), interfaces: [] },
  { id: "b", x: 240, y: 120, w: 160, h: 90, label: "Node B", color: toRGBA("#0000ff"), interfaces: [] },
];

export default function Home() {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Derive – no separate selectedNode state
  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const patchSelected = (patch: Partial<NodeData>) => {
    if (!selectedId) return;
    setNodes(prev =>
      prev.map(n => (n.id === selectedId ? { ...n, ...patch } : n))
    );
  };

  const createNode = () => {
    const id = uuidv4();
    setNodes(prev => [...prev, { id, x: 0, y: 0, w: 250, h: 100, label: "Node", color: toRGBA("#ff0000"), interfaces: [] }]);
    setSelectedId(id);
  };

  const deleteNode = () => {
    setNodes(prev => prev.filter(n => n.id !== selectedId));
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen p-5">
      <div className="flex flex-row gap-1 h-[66vh]">
        <div className="w-[83%] h-full">
          <CanvasBoard
            nodes={nodes}
            setNodes={setNodes}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        </div>

        <div className="flex-1 w-96 border rounded-lg p-4">
          {selectedNode ? (
            <div className="flex flex-col gap-4">
              <InputBox
                label="Name"
                value={selectedNode.label}
                onChange={label => patchSelected({ label })}
              />

              <PositionBox
                lables={{ x: "X", y: "Y" }}
                pos={{ x: selectedNode.x, y: selectedNode.y }}
                setData={pos => patchSelected({ x: pos.x, y: pos.y })}
              />

              <PositionBox
                lables={{ x: "W", y: "H" }}
                pos={{ x: selectedNode.w, y: selectedNode.h }}
                setData={pos => patchSelected({ w: pos.x, h: pos.y })}
              />

              {/* <ColorBox
                color={Color(selectedNode.color).hex()}
                setColor={(val) => {
                  const next = Color(val).alpha(0.85).rgb().string(); // 'rgba(r,g,b,0.85)'
                  patchSelected({ color: next });
                }}
              /> */}

              <RgbaColorPicker
                color={rgbaToObject(selectedNode.color)}
                onChange={({ r, g, b, a }) => {
                  // Build a Color from r/g/b and alpha
                  const next = Color({ r, g, b, alpha: a })   // NOT red/green/blue
                  // .alpha(0.85)
                    .rgb()
                    .string();                                // "rgba(r, g, b, a)"

                  patchSelected({ color: next });
                }}

              />

              <Button variant="destructive" size="lg" onClick={deleteNode}>
                Delete Node
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center justify-center">
              <Button size="lg" onClick={createNode}>Create Node</Button>
              <span className="text-muted-foreground">or select a node to edit</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
