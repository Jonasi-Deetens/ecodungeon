import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useGame } from "../context/GameContext";
import { EntityType, EntityState, Position, IEntity } from "../types/gameTypes";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const GameWorld: React.FC = () => {
  const {
    entities,
    player,
    playerPosition,
    dungeonSize,
    movePlayer,
    selectEntity,
    selectedEntity,
  } = useGame();

  // Calculate responsive cell size
  const getCellSize = () => {
    const maxWidth = screenWidth - 40; // Account for padding
    const maxHeight = screenHeight * 0.6; // Use 60% of screen height for grid

    const cellSizeByWidth = maxWidth / dungeonSize.width;
    const cellSizeByHeight = maxHeight / dungeonSize.height;

    return Math.min(cellSizeByWidth, cellSizeByHeight, 35); // Max 35px on large screens
  };

  const cellSize = getCellSize();

  // Get entity at a specific position
  const getEntityAtPosition = (x: number, y: number): IEntity | undefined => {
    return entities.find(
      (entity) => entity.position.x === x && entity.position.y === y
    );
  };

  // Get emoji for entity type
  const getEntityEmoji = (entity: IEntity): string => {
    if (entity.state === EntityState.DEAD) return "💀";

    switch (entity.type) {
      case EntityType.PLANT:
        return (entity as any).species === "moss" ? "🌿" : "🌱";
      case EntityType.HERBIVORE:
        return (entity as any).species === "rat" ? "🐀" : "🦔";
      case EntityType.CARNIVORE:
        return (entity as any).species === "spider" ? "🕷️" : "🦂";
      case EntityType.PLAYER:
        return "🧙";
      default:
        return "❓";
    }
  };

  // Get background color for entity health
  const getEntityColor = (entity: IEntity): string => {
    if (entity.state === EntityState.DEAD) return "#4a4a4a";

    const healthPercent = entity.health / entity.maxHealth;
    if (healthPercent > 0.7) return "#4ade80";
    if (healthPercent > 0.4) return "#fbbf24";
    return "#ef4444";
  };

  // Handle cell press
  const handleCellPress = (x: number, y: number): void => {
    const entity = getEntityAtPosition(x, y);

    if (entity) {
      selectEntity(entity);
    } else {
      // Move player to empty cell
      movePlayer(new Position(x, y));
    }
  };

  // Render a single cell
  const renderCell = (x: number, y: number): React.ReactElement => {
    const entity = getEntityAtPosition(x, y);
    const isPlayerHere =
      player && player.position.x === x && player.position.y === y;
    const isSelected =
      selectedEntity &&
      selectedEntity.position.x === x &&
      selectedEntity.position.y === y;

    let cellContent = "⬜";
    let cellStyle = [styles.cell, { width: cellSize, height: cellSize }];

    if (isPlayerHere) {
      cellContent = "🧙";
      cellStyle.push(styles.playerCell as any);
    } else if (entity) {
      cellContent = getEntityEmoji(entity);
      cellStyle.push({ backgroundColor: getEntityColor(entity) } as any);
      if (isSelected) {
        cellStyle.push(styles.selectedCell as any);
      }
    }

    return (
      <TouchableOpacity
        key={`${x}-${y}`}
        style={cellStyle as any}
        onPress={() => handleCellPress(x, y)}
        activeOpacity={0.7}
      >
        <Text style={[styles.cellText, { fontSize: cellSize * 0.6 }]}>
          {cellContent}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render the dungeon grid
  const renderGrid = (): React.ReactElement[] => {
    const grid: React.ReactElement[] = [];

    for (let y = 0; y < dungeonSize.height; y++) {
      const row: React.ReactElement[] = [];
      for (let x = 0; x < dungeonSize.width; x++) {
        row.push(renderCell(x, y));
      }
      grid.push(
        <View key={y} style={styles.row}>
          {row}
        </View>
      );
    }

    return grid;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dungeon Ecosystem</Text>
        <Text style={styles.subtitle}>
          Tap cells to move or select entities
        </Text>
      </View>

      <View style={styles.gridContainer}>
        <ScrollView
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.grid}>{renderGrid()}</View>
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>🧙</Text>
            <Text style={styles.legendText}>Player</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>🌿</Text>
            <Text style={styles.legendText}>Plants</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>🐀</Text>
            <Text style={styles.legendText}>Herbivores</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>🕷️</Text>
            <Text style={styles.legendText}>Carnivores</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>💀</Text>
            <Text style={styles.legendText}>Dead</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: screenWidth > 768 ? 24 : 20,
    fontWeight: "bold",
    color: "#4ade80",
    textAlign: "center",
  },
  subtitle: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 5,
  },
  gridContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  grid: {
    borderWidth: 2,
    borderColor: "#334155",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1e293b",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    borderWidth: 0.5,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e293b",
  },
  playerCell: {
    backgroundColor: "#3b82f6",
    borderWidth: 2,
    borderColor: "#60a5fa",
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: "#fbbf24",
  },
  cellText: {
    textAlign: "center",
  },
  legend: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginHorizontal: 10,
  },
  legendTitle: {
    fontSize: screenWidth > 768 ? 16 : 14,
    fontWeight: "bold",
    color: "#e2e8f0",
    marginBottom: 10,
    textAlign: "center",
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 60,
  },
  legendEmoji: {
    fontSize: screenWidth > 768 ? 16 : 14,
  },
  legendText: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#cbd5e1",
  },
});

export default GameWorld;
