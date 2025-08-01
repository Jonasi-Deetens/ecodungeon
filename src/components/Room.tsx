import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Position, Room as RoomType, Teleporter } from "../types/gameTypes";
import TeleporterComponent from "./Teleporter";
import Creature from "./Creature";
import { Biomes, BiomeStyle } from "../types/biomeTypes";

interface RoomConfig {
  room: RoomType;
  cameraPosition: Position;
  showRanges?: boolean;
  onTeleport?: (teleporter: Teleporter) => void;
  playerPosition: Position;
  screenWidth?: number;
  screenHeight?: number;
  teleporterStates?: { [key: string]: boolean };
  onTeleporterActivation?: (teleporterId: string, activated: boolean) => void;
  linkedTeleporters?: { [key: string]: any };
}

interface RoomProps {
  config: RoomConfig;
}

const Room: React.FC<RoomProps> = ({ config }) => {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; opacity: number }>
  >([]);

  // Get biome styling
  const biome = (Biomes[config.room.biome as keyof typeof Biomes] ||
    Biomes.laboratory)!;

  // Particle animation for room atmosphere
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        // Add new particles within room bounds
        const newParticles = [...prev];
        if (newParticles.length < biome.particleCount) {
          newParticles.push({
            id: Date.now() + Math.random(),
            x: config.room.x + Math.random() * config.room.width,
            y: config.room.y + Math.random() * config.room.height,
            opacity: 0.3,
          });
        }

        // Update existing particles
        return newParticles
          .map((particle) => ({
            ...particle,
            opacity: particle.opacity - 0.01,
            y: particle.y - 0.5,
          }))
          .filter((particle) => particle.opacity > 0);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    config.room.x,
    config.room.y,
    config.room.width,
    config.room.height,
    biome.particleCount,
  ]);

  // Calculate grid lines for floor pattern
  const gridSpacing = 100;
  const gridLinesX = Math.ceil(config.room.width / gridSpacing);
  const gridLinesY = Math.ceil(config.room.height / gridSpacing);

  return (
    <View
      style={[
        styles.room,
        {
          left: config.room.x - config.cameraPosition.x,
          top: config.room.y - config.cameraPosition.y,
          width: config.room.width,
          height: config.room.height,
        },
      ]}
    >
      {/* Room Background */}
      <View
        style={[styles.background, { backgroundColor: biome.backgroundColor }]}
      />

      {/* Room Walls */}
      <View
        style={[
          styles.roomWalls,
          {
            borderColor: biome.wallBorderColor,
            shadowColor: biome.shadowColor,
            shadowOpacity: biome.shadowOpacity,
          },
        ]}
      />

      {/* Floor Pattern */}
      <View style={[styles.floorPattern, { opacity: biome.floorOpacity }]}>
        {/* Grid pattern for floor */}
        {Array.from({ length: gridLinesX }, (_, i) => (
          <View
            key={`grid-${i}`}
            style={[
              styles.gridLine,
              {
                left: i * gridSpacing,
                backgroundColor: biome.gridColor,
                opacity: biome.gridOpacity,
              },
            ]}
          />
        ))}
        {Array.from({ length: gridLinesY }, (_, i) => (
          <View
            key={`grid-v-${i}`}
            style={[
              styles.gridLineVertical,
              {
                top: i * gridSpacing,
                backgroundColor: biome.gridColor,
                opacity: biome.gridOpacity,
              },
            ]}
          />
        ))}
      </View>

      {/* Ambient Particles */}
      <View style={styles.ambientParticles}>
        {particles.map((particle) => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x - config.room.x,
                top: particle.y - config.room.y,
                opacity: particle.opacity,
                backgroundColor: biome.particleColor,
                width: biome.particleSize,
                height: biome.particleSize,
                borderRadius: biome.particleSize / 2,
              },
            ]}
          />
        ))}
      </View>

      {/* Room Teleporters */}
      {config.room.teleporters.map((teleporter) => {
        // Get the linked teleporter from the passed data
        const linkedTeleporter = config.linkedTeleporters?.[teleporter.id];

        // Convert teleporter world coordinates to room-relative coordinates
        const roomRelativeTeleporter = {
          ...teleporter,
          x: teleporter.x - config.room.x,
          y: teleporter.y - config.room.y,
        };

        return (
          <TeleporterComponent
            key={teleporter.id}
            teleporter={roomRelativeTeleporter}
            cameraPosition={config.cameraPosition}
            onTeleport={config.onTeleport || (() => {})}
            playerPosition={config.playerPosition}
            linkedTeleporter={linkedTeleporter || undefined}
            isActivated={config.teleporterStates?.[teleporter.id] || false}
            onActivationChange={config.onTeleporterActivation || (() => {})}
            roomPosition={{ x: config.room.x, y: config.room.y }}
          />
        );
      })}

      {/* Room Entities - Already filtered by GameScreen */}
      {config.room.entities.map((entity: any) => {
        // Convert entity world coordinates to room-relative coordinates
        const roomRelativePosition = new Position(
          entity.position.x - config.room.x,
          entity.position.y - config.room.y
        );

        return (
          <Creature
            key={entity.id}
            id={entity.id}
            type={entity.type}
            position={roomRelativePosition}
            cameraPosition={config.cameraPosition}
            health={entity.health}
            maxHealth={entity.maxHealth}
            energy={entity.energy}
            maxEnergy={entity.maxEnergy}
            species={entity.species || "moss"}
            hunger={entity.hunger}
            maxHunger={entity.maxHunger}
            showRanges={config.showRanges || false}
            screenWidth={config.screenWidth || 400}
            screenHeight={config.screenHeight || 600}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  room: {
    position: "absolute",
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  roomWalls: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderWidth: 8,
    borderRadius: 0, // No rounded corners
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  floorPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  gridLine: {
    position: "absolute",
    width: 1,
    height: "100%",
  },
  gridLineVertical: {
    position: "absolute",
    height: 1,
    width: "100%",
  },
  ambientParticles: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  particle: {
    position: "absolute",
  },
});

export default Room;
