import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Position } from "../types/gameTypes";

interface PlayerProps {
  position: Position;
  cameraPosition: Position;
  characterClass: string;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
}

const Player: React.FC<PlayerProps> = ({
  position,
  cameraPosition,
  characterClass,
  health,
  maxHealth,
  energy,
  maxEnergy,
}) => {
  const getCharacterIcon = (characterClass: string) => {
    switch (characterClass) {
      case "ecologist":
        return "🌱";
      case "ranger":
        return "🏹";
      case "guardian":
        return "🛡️";
      case "wanderer":
      default:
        return "🧭";
    }
  };

  const getCharacterColor = (characterClass: string) => {
    switch (characterClass) {
      case "ecologist":
        return "#4ade80"; // Green
      case "ranger":
        return "#fbbf24"; // Yellow
      case "guardian":
        return "#3b82f6"; // Blue
      case "wanderer":
      default:
        return "#8b5cf6"; // Purple
    }
  };

  const screenX = position.x - cameraPosition.x - 20;
  const screenY = position.y - cameraPosition.y - 20;

  return (
    <View
      style={[
        styles.player,
        {
          left: screenX,
          top: screenY,
          backgroundColor: getCharacterColor(characterClass),
        },
      ]}
    >
      <Text style={styles.playerIcon}>{getCharacterIcon(characterClass)}</Text>

      {/* Health bar */}
      <View style={styles.healthBar}>
        <View
          style={[
            styles.healthFill,
            {
              width: `${(health / maxHealth) * 100}%`,
              backgroundColor: health > maxHealth * 0.5 ? "#22c55e" : "#ef4444",
            },
          ]}
        />
      </View>

      {/* Energy bar */}
      <View style={styles.energyBar}>
        <View
          style={[
            styles.energyFill,
            { width: `${(energy / maxEnergy) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  player: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  playerIcon: {
    fontSize: 24,
  },
  healthBar: {
    position: "absolute",
    bottom: -8,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 2,
  },
  energyBar: {
    position: "absolute",
    bottom: -12,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  energyFill: {
    height: "100%",
    backgroundColor: "#fbbf24",
    borderRadius: 2,
  },
});

export default Player;
