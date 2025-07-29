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
import {
  PlayerAction,
  EntityType,
  EntityState,
  IEntity,
} from "../types/gameTypes";

const { width: screenWidth } = Dimensions.get("window");

const ActionPanel: React.FC = () => {
  const {
    player,
    selectedEntity,
    performAction,
    togglePause,
    resetGame,
    isPaused,
    messages,
  } = useGame();

  if (!player) return null;

  const handleAction = (
    action: (typeof PlayerAction)[keyof typeof PlayerAction]
  ): void => {
    performAction(action, selectedEntity || undefined);
  };

  const canPerformAction = (
    action: (typeof PlayerAction)[keyof typeof PlayerAction]
  ): boolean => {
    if (!selectedEntity) return false;

    // Check if player is at the same position as selected entity
    const isAtEntityPosition = player.position.equals(selectedEntity.position);

    switch (action) {
      case PlayerAction.GATHER:
        return isAtEntityPosition && selectedEntity.state === EntityState.ALIVE;
      case PlayerAction.ATTACK:
        return (
          isAtEntityPosition &&
          selectedEntity.state === EntityState.ALIVE &&
          selectedEntity.type !== EntityType.PLANT
        );
      case PlayerAction.PLANT:
        return true; // Can plant anywhere
      case PlayerAction.OBSERVE:
        return true; // Can observe anywhere
      case PlayerAction.RESTORE:
        return true; // Can restore anywhere
      default:
        return false;
    }
  };

  const getActionDescription = (
    action: (typeof PlayerAction)[keyof typeof PlayerAction]
  ): string => {
    switch (action) {
      case PlayerAction.GATHER:
        return "Collect resources (negative eco impact)";
      case PlayerAction.ATTACK:
        return "Attack creature (high negative eco impact)";
      case PlayerAction.PLANT:
        return "Plant new life (positive eco impact)";
      case PlayerAction.OBSERVE:
        return "Study ecosystem (minimal positive impact)";
      case PlayerAction.RESTORE:
        return "Restore area (high positive eco impact)";
      default:
        return "";
    }
  };

  const getActionEmoji = (
    action: (typeof PlayerAction)[keyof typeof PlayerAction]
  ): string => {
    switch (action) {
      case PlayerAction.GATHER:
        return "📦";
      case PlayerAction.ATTACK:
        return "⚔️";
      case PlayerAction.PLANT:
        return "🌱";
      case PlayerAction.OBSERVE:
        return "🔍";
      case PlayerAction.RESTORE:
        return "✨";
      default:
        return "❓";
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>🎮 Actions</Text>

        {/* Game Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Controls</Text>

          <View style={styles.controlsGrid}>
            <TouchableOpacity
              style={[styles.controlButton, isPaused && styles.activeButton]}
              onPress={togglePause}
              activeOpacity={0.7}
            >
              <Text style={styles.controlIcon}>{isPaused ? "▶️" : "⏸️"}</Text>
              <Text style={styles.controlText}>
                {isPaused ? "Resume" : "Pause"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={resetGame}
              activeOpacity={0.7}
            >
              <Text style={styles.controlIcon}>🔄</Text>
              <Text style={styles.controlText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Player Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Actions</Text>

          {Object.values(PlayerAction).map((action) => (
            <TouchableOpacity
              key={action}
              style={[
                styles.actionButton,
                canPerformAction(action) && styles.enabledAction,
                !canPerformAction(action) && styles.disabledAction,
              ]}
              onPress={() => handleAction(action)}
              disabled={!canPerformAction(action)}
              activeOpacity={0.7}
            >
              <View style={styles.actionHeader}>
                <Text style={styles.actionEmoji}>{getActionEmoji(action)}</Text>
                <Text
                  style={[
                    styles.actionText,
                    canPerformAction(action)
                      ? styles.enabledText
                      : styles.disabledText,
                  ]}
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </Text>
              </View>
              <Text style={styles.actionDescription}>
                {getActionDescription(action)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Entity */}
        {selectedEntity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Entity</Text>
            <View style={styles.entityCard}>
              <View style={styles.entityHeader}>
                <Text style={styles.entityEmoji}>
                  {selectedEntity.type === EntityType.PLANT
                    ? "🌿"
                    : selectedEntity.type === EntityType.HERBIVORE
                    ? "🐀"
                    : selectedEntity.type === EntityType.CARNIVORE
                    ? "🕷️"
                    : "❓"}
                </Text>
                <View style={styles.entityInfo}>
                  <Text style={styles.entityName}>
                    {(selectedEntity as any).species || selectedEntity.type}
                  </Text>
                  <Text style={styles.entityState}>
                    State: {selectedEntity.state}
                  </Text>
                </View>
              </View>

              <View style={styles.entityStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Health</Text>
                  <Text style={styles.statValue}>
                    {Math.round(selectedEntity.health)}/
                    {selectedEntity.maxHealth}
                  </Text>
                </View>

                {selectedEntity.type === EntityType.HERBIVORE && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Hunger</Text>
                    <Text style={styles.statValue}>
                      {Math.round((selectedEntity as any).hunger)}/
                      {(selectedEntity as any).maxHunger}
                    </Text>
                  </View>
                )}

                {selectedEntity.type === EntityType.CARNIVORE && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Hunger</Text>
                    <Text style={styles.statValue}>
                      {Math.round((selectedEntity as any).hunger)}/
                      {(selectedEntity as any).maxHunger}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Game Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Messages</Text>
          <View style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            ) : (
              messages
                .slice(-8)
                .reverse()
                .map((message, index) => (
                  <View key={index} style={styles.messageItem}>
                    <Text style={styles.messageText}>{message.text}</Text>
                    <Text style={styles.messageTime}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 15,
  },
  title: {
    fontSize: screenWidth > 768 ? 20 : 18,
    fontWeight: "bold",
    color: "#4ade80",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: screenWidth > 768 ? 16 : 14,
    fontWeight: "bold",
    color: "#e2e8f0",
    marginBottom: 12,
  },
  controlsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  controlButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#4ade80",
  },
  controlIcon: {
    fontSize: screenWidth > 768 ? 24 : 20,
    marginBottom: 8,
  },
  controlText: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  enabledAction: {
    backgroundColor: "#1e293b",
  },
  disabledAction: {
    backgroundColor: "#334155",
    opacity: 0.5,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: screenWidth > 768 ? 24 : 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: screenWidth > 768 ? 16 : 14,
    fontWeight: "bold",
    flex: 1,
  },
  enabledText: {
    color: "#e2e8f0",
  },
  disabledText: {
    color: "#64748b",
  },
  actionDescription: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#94a3b8",
    marginLeft: 36,
  },
  entityCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
  },
  entityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  entityEmoji: {
    fontSize: screenWidth > 768 ? 32 : 28,
    marginRight: 12,
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: screenWidth > 768 ? 18 : 16,
    fontWeight: "bold",
    color: "#e2e8f0",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  entityState: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#94a3b8",
  },
  entityStats: {
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#cbd5e1",
  },
  statValue: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#4ade80",
    fontWeight: "bold",
  },
  messagesContainer: {
    maxHeight: 200,
  },
  emptyCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#64748b",
    fontStyle: "italic",
  },
  messageItem: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#e2e8f0",
    marginBottom: 4,
  },
  messageTime: {
    fontSize: screenWidth > 768 ? 10 : 8,
    color: "#94a3b8",
  },
});

export default ActionPanel;
