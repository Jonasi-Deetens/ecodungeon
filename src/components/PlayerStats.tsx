import React from "react";
import { StyleSheet, View, Text, ScrollView, Dimensions } from "react-native";
import { useGame } from "../context/GameContext";

const { width: screenWidth } = Dimensions.get("window");

const PlayerStats: React.FC = () => {
  const { player } = useGame();

  if (!player) return null;

  const getImpactColor = (impact: number): string => {
    if (impact > 10) return "#4ade80"; // Green for positive
    if (impact > 0) return "#fbbf24"; // Yellow for slightly positive
    if (impact > -10) return "#f97316"; // Orange for slightly negative
    return "#ef4444"; // Red for very negative
  };

  const getImpactText = (impact: number): string => {
    if (impact > 10) return "Eco Guardian";
    if (impact > 0) return "Eco Friendly";
    if (impact > -10) return "Eco Neutral";
    return "Eco Threat";
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>🧙 Player Stats</Text>

        {/* Health & Energy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Energy</Text>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Health</Text>
              <Text style={styles.statValue}>
                {Math.round(player.health)}/{player.maxHealth}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(player.health / player.maxHealth) * 100}%`,
                    backgroundColor:
                      player.health > player.maxHealth * 0.7
                        ? "#4ade80"
                        : player.health > player.maxHealth * 0.4
                        ? "#fbbf24"
                        : "#ef4444",
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Energy</Text>
              <Text style={styles.statValue}>
                {Math.round(player.energy)}/{player.maxEnergy}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(player.energy / player.maxEnergy) * 100}%`,
                    backgroundColor:
                      player.energy > player.maxEnergy * 0.7
                        ? "#4ade80"
                        : player.energy > player.maxEnergy * 0.4
                        ? "#fbbf24"
                        : "#ef4444",
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Position Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              X: {player.position.x}, Y: {player.position.y}
            </Text>
          </View>
        </View>

        {/* Eco Impact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eco Impact</Text>
          <View style={styles.impactCard}>
            <Text
              style={[
                styles.impactText,
                { color: getImpactColor(player.ecoImpact) },
              ]}
            >
              {getImpactText(player.ecoImpact)}
            </Text>
            <Text
              style={[
                styles.impactValue,
                { color: getImpactColor(player.ecoImpact) },
              ]}
            >
              {player.ecoImpact > 0 ? "+" : ""}
              {Math.round(player.ecoImpact)}
            </Text>
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsCard}>
            <View style={styles.skillRow}>
              <Text style={styles.skillLabel}>Observation</Text>
              <Text style={styles.skillValue}>{player.observationSkill}</Text>
            </View>
            <View style={styles.skillRow}>
              <Text style={styles.skillLabel}>Restoration</Text>
              <Text style={styles.skillValue}>{player.restorationSkill}</Text>
            </View>
          </View>
        </View>

        {/* Inventory Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Inventory ({player.inventory.length})
          </Text>
          {player.inventory.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Empty</Text>
            </View>
          ) : (
            player.inventory.map((item, index) => (
              <View key={index} style={styles.inventoryItem}>
                <Text style={styles.itemEmoji}>
                  {item.type === "plant"
                    ? "🌿"
                    : item.type === "herbivore"
                    ? "🐀"
                    : item.type === "carnivore"
                    ? "🕷️"
                    : "❓"}
                </Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {(item as any).species || item.type}
                  </Text>
                  <Text style={styles.itemHealth}>
                    Health: {Math.round(item.health)}
                  </Text>
                </View>
              </View>
            ))
          )}
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
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#cbd5e1",
    fontWeight: "500",
  },
  statValue: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#4ade80",
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  infoCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
  },
  infoText: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#cbd5e1",
    textAlign: "center",
  },
  impactCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  impactText: {
    fontSize: screenWidth > 768 ? 16 : 14,
    fontWeight: "bold",
  },
  impactValue: {
    fontSize: screenWidth > 768 ? 18 : 16,
    fontWeight: "bold",
  },
  skillsCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
  },
  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  skillLabel: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#cbd5e1",
  },
  skillValue: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#4ade80",
    fontWeight: "bold",
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
  inventoryItem: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  itemEmoji: {
    fontSize: screenWidth > 768 ? 20 : 18,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#e2e8f0",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  itemHealth: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#94a3b8",
    marginTop: 2,
  },
});

export default PlayerStats;
