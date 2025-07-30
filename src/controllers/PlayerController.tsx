import { useCallback, useRef, useEffect } from "react";
import { Position } from "../types/gameTypes";

interface PlayerControllerProps {
  playerPosition: Position;
  onPositionChange: (newPosition: Position) => void;
  onAction: (action: string, targetEntity?: any) => void;
  worldBounds: { width: number; height: number };
  movementSpeed: number;
}

export const usePlayerController = ({
  playerPosition,
  onPositionChange,
  onAction,
  worldBounds,
  movementSpeed,
}: PlayerControllerProps) => {
  const animationFrameRef = useRef<number | null>(null);
  const movementDirection = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPositionRef = useRef<Position>(playerPosition);
  const onPositionChangeRef = useRef(onPositionChange);
  const worldBoundsRef = useRef(worldBounds);
  const movementSpeedRef = useRef(movementSpeed);

  // Update refs when props change
  useEffect(() => {
    currentPositionRef.current = playerPosition;
    onPositionChangeRef.current = onPositionChange;
    worldBoundsRef.current = worldBounds;
    movementSpeedRef.current = movementSpeed;
  }, [playerPosition, onPositionChange, worldBounds, movementSpeed]);

  // Handle joystick movement
  const handleJoystickMove = useCallback(
    (direction: { x: number; y: number }) => {
      movementDirection.current = direction;

      // Start animation if not already running
      if (!animationFrameRef.current) {
        const animate = () => {
          if (
            movementDirection.current.x !== 0 ||
            movementDirection.current.y !== 0
          ) {
            const newX =
              currentPositionRef.current.x +
              movementDirection.current.x * movementSpeedRef.current;
            const newY =
              currentPositionRef.current.y +
              movementDirection.current.y * movementSpeedRef.current;

            // Keep player within world bounds
            const boundedX = Math.max(
              50,
              Math.min(newX, worldBoundsRef.current.width - 50)
            );
            const boundedY = Math.max(
              50,
              Math.min(newY, worldBoundsRef.current.height - 50)
            );

            const newPosition = new Position(boundedX, boundedY);
            onPositionChangeRef.current(newPosition);

            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            animationFrameRef.current = null;
          }
        };
        animate();
      }
    },
    [] // No dependencies - uses refs instead
  );

  // Player actions
  const performAction = useCallback(
    (action: string) => {
      onAction(action);
    },
    [onAction]
  );

  const heal = useCallback(() => {
    onAction("heal");
  }, [onAction]);

  return {
    handleJoystickMove,
    performAction,
    heal,
  };
};
