import { useCallback, useRef, useEffect } from "react";
import { Position, Room } from "../types/gameTypes";

interface PlayerControllerProps {
  playerPosition: Position;
  onPositionChange: (newPosition: Position) => void;
  onAction: (action: string, targetEntity?: any) => void;
  worldBounds: { width: number; height: number };
  movementSpeed: number;
  rooms: Room[];
  currentRoomId: string;
}

export const usePlayerController = ({
  playerPosition,
  onPositionChange,
  onAction,
  worldBounds,
  movementSpeed,
  rooms,
  currentRoomId,
}: PlayerControllerProps) => {
  const animationFrameRef = useRef<number | null>(null);
  const movementDirection = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPositionRef = useRef<Position>(playerPosition);
  const onPositionChangeRef = useRef(onPositionChange);
  const worldBoundsRef = useRef(worldBounds);
  const movementSpeedRef = useRef(movementSpeed);
  const roomsRef = useRef(rooms);
  const currentRoomIdRef = useRef(currentRoomId);

  // Update refs when props change
  useEffect(() => {
    currentPositionRef.current = playerPosition;
    onPositionChangeRef.current = onPositionChange;
    worldBoundsRef.current = worldBounds;
    movementSpeedRef.current = movementSpeed;
    roomsRef.current = rooms;
    currentRoomIdRef.current = currentRoomId;
  }, [
    playerPosition,
    onPositionChange,
    worldBounds,
    movementSpeed,
    rooms,
    currentRoomId,
  ]);

  // Get a valid position by constraining movement to room bounds or door areas
  const getValidPosition = useCallback((pos: Position): Position => {
    const currentRoom = roomsRef.current.find(
      (room) => room.id === currentRoomIdRef.current
    );
    if (!currentRoom) return pos;

    // Check if position is within current room bounds
    const withinRoom =
      pos.x >= currentRoom.x + 50 &&
      pos.x <= currentRoom.x + currentRoom.width - 50 &&
      pos.y >= currentRoom.y + 50 &&
      pos.y <= currentRoom.y + currentRoom.height - 50;

    if (withinRoom) return pos;

    // If not within room or through door, constrain to room bounds
    const constrainedX = Math.max(
      currentRoom.x + 50,
      Math.min(currentRoom.x + currentRoom.width - 50, pos.x)
    );
    const constrainedY = Math.max(
      currentRoom.y + 50,
      Math.min(currentRoom.y + currentRoom.height - 50, pos.y)
    );

    return new Position(constrainedX, constrainedY);
  }, []);

  // Check if position is valid within a specific room
  const isValidPositionInRoom = useCallback(
    (pos: Position, room: Room): boolean => {
      return (
        pos.x >= room.x + 50 &&
        pos.x <= room.x + room.width - 50 &&
        pos.y >= room.y + 50 &&
        pos.y <= room.y + room.height - 50
      );
    },
    []
  );

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

            // Get valid position (constrained to room bounds or door areas)
            const newPosition = new Position(newX, newY);
            const validPosition = getValidPosition(newPosition);
            onPositionChangeRef.current(validPosition);

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
