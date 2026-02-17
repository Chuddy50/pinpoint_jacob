import { useEffect, useRef, useState } from "react";

const DEFAULT_POS = { x: 24, y: 24 };
const WIDGET_SIZE = { width: 320, height: 420 };
const COLLAPSED_HEIGHT = 56;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [rememberedClosedPos, setRememberedClosedPos] = useState({ x: 24, y: 24 });
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const startPos = {
      x: window.innerWidth - WIDGET_SIZE.width - DEFAULT_POS.x,
      y: window.innerHeight - COLLAPSED_HEIGHT - DEFAULT_POS.y,
    };
    setPos(startPos);
    setRememberedClosedPos(startPos);
  }, []);

  function clampToViewport(position, openState) {
    const currentWidth = openState ? WIDGET_SIZE.width : WIDGET_SIZE.width;
    const currentHeight = openState ? WIDGET_SIZE.height : COLLAPSED_HEIGHT;
    const maxX = window.innerWidth - currentWidth - 8;
    const maxY = window.innerHeight - currentHeight - 8;
    return {
      x: Math.max(8, Math.min(position.x, maxX)),
      y: Math.max(8, Math.min(position.y, maxY)),
    };
  }

  useEffect(() => {
    function handleMouseMove(e) {
      if (!isDragging) return;
      const nextX = e.clientX - dragOffset.current.x;
      const nextY = e.clientY - dragOffset.current.y;

      const nextPos = clampToViewport({ x: nextX, y: nextY }, isOpen);
      setPos(nextPos);
      if (!isOpen) {
        setRememberedClosedPos({ x: nextX, y: nextY });
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isOpen]);

  useEffect(() => {
    function handleResize() {
      if (!isOpen) return;
      setPos((current) => clampToViewport(current, true));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  function handleDragStart(e) {
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    setIsDragging(true);
  }

  function toggleOpen() {
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        setPos(clampToViewport(pos, true));
      } else {
        setPos(rememberedClosedPos);
      }
      return nextOpen;
    });
  }

  return (
    <div
      className="fixed z-50 shadow-xl border border-gray-200 bg-white rounded-xl overflow-hidden select-none"
      style={{
        width: WIDGET_SIZE.width,
        height: isOpen ? WIDGET_SIZE.height : COLLAPSED_HEIGHT,
        left: pos.x,
        top: pos.y,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white cursor-move"
        onMouseDown={handleDragStart}
        onDoubleClick={toggleOpen}
      >
        <span className="text-sm font-semibold">PinPoint Assistant</span>
        <button
          type="button"
          onClick={toggleOpen}
          className="text-xs rounded-full bg-white/10 px-2 py-1 hover:bg-white/20"
        >
          {isOpen ? "Close" : "Open"}
        </button>
      </div>

      {isOpen && (
        <div className="h-full bg-white p-4 text-sm text-gray-500">
          Chat widget shell (empty for now).
        </div>
      )}
    </div>
  );
}
