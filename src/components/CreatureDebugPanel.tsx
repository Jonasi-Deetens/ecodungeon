import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { IEntity, EntityType } from "../types/gameTypes";

interface CreatureDebugPanelProps {
  entities: IEntity[];
  visible: boolean;
}

const CreatureDebugPanel: React.FC<CreatureDebugPanelProps> = ({
  entities,
  visible,
}) => {
  if (!visible) return null;

  // Filter to only show creatures (herbivores and carnivores)
  const creatures = entities.filter(
    (entity) =>
      entity.type === EntityType.HERBIVORE ||
      entity.type === EntityType.CARNIVORE
  );

  const getStateColor = (state: string) => {
    switch (state) {
      case "hunting":
      case "grazing":
        return "#4ade80"; // Green for food-seeking
      case "fleeing":
        return "#ef4444"; // Red for fleeing
      case "sleeping":
      case "resting":
        return "#3b82f6"; // Blue for resting
      case "patrolling_territory":
      case "defending_territory":
        return "#f59e0b"; // Orange for territory
      case "courtship":
      case "socializing":
        return "#ec4899"; // Pink for social
      default:
        return "#94a3b8"; // Gray for default
    }
  };

  const getHungerColor = (hunger: number, maxHunger: number) => {
    const hungerPercent = (hunger / maxHunger) * 100;
    if (hungerPercent > 80) return "#ef4444"; // Red for very hungry (>80%)
    if (hungerPercent > 60) return "#f59e0b"; // Orange for hungry (>60%)
    if (hungerPercent > 40) return "#eab308"; // Yellow for somewhat hungry (>40%)
    return "#4ade80"; // Green for not hungry
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creature Debug Panel</Text>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {creatures.length === 0 ? (
          <Text style={styles.noCreatures}>No creatures in current room</Text>
        ) : (
          creatures.map((creature) => {
            const hungerPercent =
              ((creature as any).hunger / (creature as any).maxHunger) * 100;
            const stateColor = getStateColor(creature.state);
            const hungerColor = getHungerColor(
              (creature as any).hunger,
              (creature as any).maxHunger
            );

            return (
              <View key={creature.id} style={styles.creatureCard}>
                <View style={styles.creatureHeader}>
                  <Text style={styles.creatureType}>
                    {creature.type === EntityType.HERBIVORE ? "🦌" : "🐺"}{" "}
                    {creature.type}
                  </Text>
                  <Text style={styles.creatureId}>
                    ID: {creature.id.slice(-4)}
                  </Text>
                </View>

                <View style={styles.creatureInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>State:</Text>
                    <Text style={[styles.infoValue, { color: stateColor }]}>
                      {creature.behaviorState}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hunger:</Text>
                    <Text style={[styles.infoValue, { color: hungerColor }]}>
                      {hungerPercent.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Health:</Text>
                    <Text style={styles.infoValue}>
                      {creature.health.toFixed(0)}/{creature.maxHealth}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Position:</Text>
                    <Text style={styles.infoValue}>
                      ({creature.position.x.toFixed(0)},{" "}
                      {creature.position.y.toFixed(0)})
                    </Text>
                  </View>

                  {(creature as any).speed && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Speed:</Text>
                      <Text style={styles.infoValue}>
                        {(creature as any).speed.toFixed(1)}
                      </Text>
                    </View>
                  )}

                  {(creature as any).currentTarget && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Target:</Text>
                      <Text style={styles.infoValue}>
                        {(creature as any).currentTarget.slice(-4)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    maxHeight: 300,
    zIndex: 100,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e2e8f0",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  scrollView: {
    maxHeight: 250,
  },
  noCreatures: {
    color: "#94a3b8",
    textAlign: "center",
    padding: 20,
    fontStyle: "italic",
  },
  creatureCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  creatureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  creatureType: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e2e8f0",
  },
  creatureId: {
    fontSize: 12,
    color: "#64748b",
  },
  creatureInfo: {
    gap: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 12,
    color: "#e2e8f0",
    fontWeight: "bold",
  },
});

export default CreatureDebugPanel;
