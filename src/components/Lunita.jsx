// src/components/Lunita.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function Lunita() {
  const SIZE = 80;
  const HALF = SIZE / 2;
  const DISTANCE_THRESHOLD = 6;
  const SPEED = 180;

  const [target, setTarget] = useState({ x: 150, y: 150 });
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const [frame, setFrame] = useState(0);
  const [state, setState] = useState("idle"); // idle | walk | sleep | pet
  const [direction, setDirection] = useState("down");
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  const sprites = {
    idle: ["/sprites/idle1.png", "/sprites/idle2.png"],
    sleep: [
      "/sprites/sleep1.png","/sprites/sleep2.png","/sprites/sleep3.png",
      "/sprites/sleep4.png","/sprites/sleep5.png","/sprites/sleep6.png",
      "/sprites/sleep7.png","/sprites/sleep8.png","/sprites/sleep9.png",
      "/sprites/sleep10.png","/sprites/sleep11.png",
    ],
    walk: {
      up: ["/sprites/walk_up1.png", "/sprites/walk_up2.png"],
      down: ["/sprites/walk_down1.png", "/sprites/walk_down2.png"],
      left: ["/sprites/walk_left1.png", "/sprites/walk_left2.png"],
      right: ["/sprites/walk_right1.png", "/sprites/walk_right2.png"],
    },
    pet: [
      "/sprites/pet1.png",
      "/sprites/pet2.png",
      "/sprites/pet3.png",
      "/sprites/pet4.png",
      "/sprites/pet5.png",
    ],
  };

  const spriteScales = { idle: 0.7, sleep: 0.7, walk: 1, pet: 0.7 };
  const frameSpeed = { idle: 300, walk: 250, sleep: 300 };
  const pauseAfterIdle = 1000;

  const idleTimeout = useRef(null);

  // Tap / click -> caminar
  useEffect(() => {
    const handlePointerDown = (e) => {
      const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const y = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;

      // Comprobar si se toca Lunita para pet
      if (
        x >= position.x - HALF &&
        x <= position.x + HALF &&
        y >= position.y - HALF &&
        y <= position.y + HALF
      ) {
        setState("pet");
        setFrame(0);
        setLastInteraction(Date.now());
        return;
      }

      setTarget({ x, y });
      setState("walk");
      setLastInteraction(Date.now());
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [position]);

  // Frames walk / sleep
  useEffect(() => {
    if (state !== "walk" && state !== "sleep") return;
    const totalFrames =
      state === "sleep"
        ? sprites.sleep.length
        : sprites.walk[direction]?.length || 1;
    const id = setInterval(() => {
      setFrame(f => (f + 1) % totalFrames);
    }, frameSpeed[state]);
    return () => clearInterval(id);
  }, [state, direction]);

  // Frames idle con 2 parpadeos y pausa
  useEffect(() => {
    if (state !== "idle") return;
    let isMounted = true;
    let frameIndex = 0;
    let blinkCount = 0;
    const blinksPerCycle = 2;

    const nextFrame = () => {
      if (!isMounted) return;

      setFrame(frameIndex);
      if (frameIndex === 1) blinkCount += 1;

      if (blinkCount >= blinksPerCycle) {
        setFrame(0);
        idleTimeout.current = setTimeout(() => {
          if (!isMounted) return;
          frameIndex = 0;
          blinkCount = 0;
          nextFrame();
        }, pauseAfterIdle);
        return;
      }

      frameIndex = frameIndex === 0 ? 1 : 0;
      idleTimeout.current = setTimeout(nextFrame, frameSpeed.idle);
    };

    nextFrame();
    return () => {
      isMounted = false;
      clearTimeout(idleTimeout.current);
    };
  }, [state]);

  // Animación pet
  useEffect(() => {
    if (state !== "pet") return;
  
    let isMounted = true;
    let curFrame = 0;
  
    const nextFrame = () => {
      if (!isMounted) return;
  
      // Mostrar el frame actual
      setFrame(curFrame);
  
      // Si estamos en el último frame, terminamos después de mostrarlo
      if (curFrame === sprites.pet.length - 1) {
        setTimeout(() => {
          if (!isMounted) return;
          setState("idle");
          setFrame(0);
        }, 150); // tiempo para que se vea pet5
        return;
      }
  
      // pasar al siguiente frame
      curFrame += 1;
      idleTimeout.current = setTimeout(nextFrame, 190); // tiempo entre frames
    };
  
    nextFrame();
  
    return () => {
      isMounted = false;
      clearTimeout(idleTimeout.current);
    };
  }, [state]);
  

  // Inactividad -> sleep
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastInteraction > 5000 && state !== "sleep") {
        setState("sleep");
        setFrame(0);
      }
    }, 500);
    return () => clearInterval(id);
  }, [lastInteraction, state]);

  // Actualiza dirección
  useEffect(() => {
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? "right" : "left");
    else setDirection(dy > 0 ? "down" : "up");
  }, [target, position]);

  const getSprite = () => {
    if (state === "sleep") return sprites.sleep[frame % sprites.sleep.length];
    if (state === "walk") return (sprites.walk[direction] || sprites.walk.down)[frame % (sprites.walk[direction]?.length || 1)];
    if (state === "pet") return sprites.pet[frame % sprites.pet.length];
    return sprites.idle[frame % sprites.idle.length];
  };

  // Actualiza posición
  const handleUpdate = (latest) => {
    const left = typeof latest.left === "number" ? latest.left : parseFloat(latest.left || 0);
    const top = typeof latest.top === "number" ? latest.top : parseFloat(latest.top || 0);
    const curX = left + HALF;
    const curY = top + HALF;
    setPosition({ x: curX, y: curY });

    const dx = target.x - curX;
    const dy = target.y - curY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= DISTANCE_THRESHOLD && state === "walk") {
      setPosition({ x: target.x, y: target.y });
      setState("idle");
      setFrame(0);
      setLastInteraction(Date.now());
    }
  };

  const distance = Math.sqrt(Math.pow(target.x - position.x, 2) + Math.pow(target.y - position.y, 2));
  const duration = distance / SPEED;

  return (
    <motion.img
      src={getSprite()}
      alt="Lunita"
      className="lunita-sprite"
      style={{
        position: "fixed",
        left: position.x - HALF,
        top: position.y - HALF,
        width: SIZE,
        height: SIZE,
        pointerEvents: "auto",
        userSelect: "none",
        imageRendering: "pixelated",
      }}
      animate={{
        left: target.x - HALF,
        top: target.y - HALF,
        scale: spriteScales[state] || 1,
      }}
      transition={{
        type: "tween",
        duration: duration,
        ease: "linear",
      }}
      onUpdate={handleUpdate}
      draggable={false}
    />
  );
}
