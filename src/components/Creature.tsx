import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Position, EntityTypeValue, EntityType } from "../types/gameTypes";

interface CreatureProps {
  id: string;
  type: EntityTypeValue;
  position: Position;
  cameraPosition: Position;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  species: string;
  hunger?: number;
  maxHunger?: number;
  showRanges?: boolean;
  screenWidth?: number;
  screenHeight?: number;
}

const Creature: React.FC<CreatureProps> = ({
  type,
  position,
  cameraPosition,
  health,
  maxHealth,
  energy,
  maxEnergy,
  species,
  hunger,
  maxHunger,
  showRanges = false,
  screenWidth = 400,
  screenHeight = 600,
}) => {
  const getCreatureIcon = (type: EntityTypeValue, species: string) => {
    switch (type) {
      case EntityType.PLANT:
        return "🌱";
      case EntityType.HERBIVORE:
        switch (species) {
          case "rabbit":
            return "🐰";
          case "deer":
            return "🦌";
          case "mouse":
            return "🐁";
          default:
            return "🐰";
        }
      case EntityType.CARNIVORE:
        switch (species) {
          case "rat":
            return "🐀";
          case "wolf":
            return "🐺";
          case "snake":
            return "🐍";
          default:
            return "🐀";
        }
      default:
        return "❓";
    }
  };

  const getCreatureColor = (type: EntityTypeValue, species: string) => {
    switch (type) {
      case EntityType.PLANT:
        return "#4ade80"; // Green
      case EntityType.HERBIVORE:
        switch (species) {
          case "rabbit":
            return "#f3f4f6"; // Light gray
          case "deer":
            return "#d97706"; // Orange
          case "mouse":
            return "#fbbf24"; // Yellow
          default:
            return "#f3f4f6";
        }
      case EntityType.CARNIVORE:
        switch (species) {
          case "rat":
            return "#6b7280"; // Gray
          case "wolf":
            return "#374151"; // Dark gray
          case "snake":
            return "#059669"; // Green
          default:
            return "#6b7280";
        }
      default:
        return "#94a3b8";
    }
  };

  const getCreatureSize = (type: EntityTypeValue, species: string) => {
    switch (type) {
      case EntityType.PLANT:
        return 25;
      case EntityType.HERBIVORE:
        switch (species) {
          case "rat":
            return 30;
          case "rabbit":
            return 35;
          case "deer":
            return 45;
          default:
            return 30;
        }
      case EntityType.CARNIVORE:
        switch (species) {
          case "spider":
            return 28;
          case "wolf":
            return 40;
          case "snake":
            return 35;
          default:
            return 28;
        }
      default:
        return 30;
    }
  };

  const size = getCreatureSize(type, species);
  const screenX = position.x - size / 2;
  const screenY = position.y - size / 2;

  // Only render if visible on screen (using actual screen bounds)
  const margin = 2000; // Much larger margin to prevent entities from "teleporting" into view
  if (
    screenX < -margin ||
    screenX > screenWidth + margin ||
    screenY < -margin ||
    screenY > screenHeight + margin
  ) {
    return null;
  }

  return (
    <View
      style={[
        styles.creature,
        {
          left: screenX,
          top: screenY,
          width: size,
          height: size,
        },
      ]}
    >
      <Text style={[styles.creatureIcon, { fontSize: size * 0.6 }]}>
        {getCreatureIcon(type, species)}
      </Text>

      {/* Range indicators */}
      {showRanges && (
        <>
          {/* Hunt range for carnivores */}
          {type === EntityType.CARNIVORE && (
            <View style={[styles.rangeIndicator, styles.huntRange]} />
          )}

          {/* Flee range for herbivores */}
          {type === EntityType.HERBIVORE && (
            <View style={[styles.rangeIndicator, styles.fleeRange]} />
          )}

          {/* Food detection range for herbivores */}
          {type === EntityType.HERBIVORE && (
            <View style={[styles.rangeIndicator, styles.foodRange]} />
          )}
        </>
      )}

      {/* Health bar for creatures */}
      {type !== EntityType.PLANT && (
        <View style={styles.healthBar}>
          <View
            style={[
              styles.healthFill,
              {
                width: `${(health / maxHealth) * 100}%`,
                backgroundColor:
                  health > maxHealth * 0.5 ? "#22c55e" : "#ef4444",
              },
            ]}
          />
        </View>
      )}

      {/* Hunger bar for herbivores and carnivores */}
      {(type === EntityType.HERBIVORE || type === EntityType.CARNIVORE) &&
        hunger !== undefined &&
        maxHunger !== undefined && (
          <View style={styles.hungerBar}>
            <View
              style={[
                styles.hungerFill,
                {
                  width: `${(hunger / maxHunger) * 100}%`,
                  backgroundColor:
                    hunger > maxHunger * 0.7 ? "#ef4444" : "#fbbf24",
                },
              ]}
            />
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  creature: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  creatureIcon: {
    textAlign: "center",
  },
  healthBar: {
    position: "absolute",
    bottom: -6,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 2,
  },
  hungerBar: {
    position: "absolute",
    bottom: -9,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  hungerFill: {
    height: "100%",
    borderRadius: 2,
  },
  rangeIndicator: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  huntRange: {
    width: 240, // 120px radius * 2 (from AdvancedCarnivoreAI huntRange)
    height: 240,
    left: -100,
    top: -100,
    borderColor: "rgba(239, 68, 68, 0.4)", // Red for hunting
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  fleeRange: {
    width: 160, // 80px radius * 2 (from AdvancedHerbivoreAI flee distance)
    height: 160,
    left: -60,
    top: -60,
    borderColor: "rgba(59, 130, 246, 0.4)", // Blue for fleeing
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  foodRange: {
    width: 100, // 50px radius * 2 (from AdvancedHerbivoreAI foodDetectionRange)
    height: 100,
    left: -25,
    top: -25,
    borderColor: "rgba(34, 197, 94, 0.4)", // Green for food
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
});

export default Creature;
