"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import HUD from "@/components/HUD";
import { GameState, InputState, createInitialState, stepSimulation } from "@/game/engine";

// Dynamic import to avoid SSR issues with Three.js
const GameScene = dynamic(() => import("@/components/GameScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
      <div className="text-cyan-400 text-xl animate-pulse">Loading 3D Engine...</div>
    </div>
  ),
});

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const inputRef = useRef<InputState>({
    pitchUp: false,
    pitchDown: false,
    yawLeft: false,
    yawRight: false,
    rollLeft: false,
    rollRight: false,
  });
  const gameLoopRef = useRef<number | null>(null);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === "w" || key === "arrowup") inputRef.current.pitchUp = true;
    if (key === "s" || key === "arrowdown") inputRef.current.pitchDown = true;
    if (key === "a" || key === "arrowleft") inputRef.current.yawLeft = true;
    if (key === "d" || key === "arrowright") inputRef.current.yawRight = true;
    if (key === "q") inputRef.current.rollLeft = true;
    if (key === "e") inputRef.current.rollRight = true;
    if (key === "r") {
      setGameState(createInitialState());
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === "w" || key === "arrowup") inputRef.current.pitchUp = false;
    if (key === "s" || key === "arrowdown") inputRef.current.pitchDown = false;
    if (key === "a" || key === "arrowleft") inputRef.current.yawLeft = false;
    if (key === "d" || key === "arrowright") inputRef.current.yawRight = false;
    if (key === "q") inputRef.current.rollLeft = false;
    if (key === "e") inputRef.current.rollRight = false;
  }, []);

  // Game loop
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let lastTime = performance.now();
    const tick = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Run multiple physics steps per frame for stability
      const steps = Math.max(1, Math.floor(dt / (1 / 60)));
      setGameState((prev) => {
        let state = prev;
        for (let i = 0; i < steps && state.outcome === "playing"; i++) {
          state = stepSimulation(state, inputRef.current);
        }
        return state;
      });

      gameLoopRef.current = requestAnimationFrame(tick);
    };

    gameLoopRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-900">
      <GameScene state={gameState} />
      <HUD state={gameState} />
    </main>
  );
}
