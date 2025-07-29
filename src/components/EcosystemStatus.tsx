import React from "react";
import { StyleSheet, View, Text, ScrollView, Dimensions } from "react-native";
import { useGame } from "../context/GameContext";
import { EntityType, EntityState, EcosystemHealth } from "../types/gameTypes";

const { width: screenWidth } = Dimensions.get("window");

const EcosystemStatus: React.FC = () => {
  const { entities, ecosystemHealth, gameTime } = useGame();

  const getHealthColor = (
    health: (typeof EcosystemHealth)[keyof typeof EcosystemHealth]
  ): string => {
    switch (health) {
      case EcosystemHealth.EXCELLENT:
        return "#4ade80";
      case EcosystemHealth.GOOD:
        return "#22c55e";
      case EcosystemHealth.FAIR:
        return "#fbbf24";
      case EcosystemHealth.POOR:
        return "#f97316";
      case EcosystemHealth.CRITICAL:
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const getHealthEmoji = (
    health: (typeof EcosystemHealth)[keyof typeof EcosystemHealth]
  ): string => {
    switch (health) {
      case EcosystemHealth.EXCELLENT:
        return "🌿";
      case EcosystemHealth.GOOD:
        return "🌱";
      case EcosystemHealth.FAIR:
        return "🍃";
      case EcosystemHealth.POOR:
        return "🥀";
      case EcosystemHealth.CRITICAL:
        return "💀";
      default:
        return "❓";
    }
  };

  const getHealthDescription = (
    health: (typeof EcosystemHealth)[keyof typeof EcosystemHealth]
  ): string => {
    switch (health) {
      case EcosystemHealth.EXCELLENT:
        return "Perfect Balance";
      case EcosystemHealth.GOOD:
        return "Healthy";
      case EcosystemHealth.FAIR:
        return "Stable";
      case EcosystemHealth.POOR:
        return "Unstable";
      case EcosystemHealth.CRITICAL:
        return "Collapsing";
      default:
        return "Unknown";
    }
  };

  // Count entities by type and state
  const entityCounts = {
    plants: entities.filter(
      (e) => e.type === EntityType.PLANT && e.state === EntityState.ALIVE
    ).length,
    herbivores: entities.filter(
      (e) => e.type === EntityType.HERBIVORE && e.state === EntityState.ALIVE
    ).length,
    carnivores: entities.filter(
      (e) => e.type === EntityType.CARNIVORE && e.state === EntityState.ALIVE
    ).length,
    dead: entities.filter((e) => e.state === EntityState.DEAD).length,
    total: entities.length,
  };

  // Calculate ratios
  const totalAlive =
    entityCounts.plants + entityCounts.herbivores + entityCounts.carnivores;
  const plantRatio =
    totalAlive > 0
      ? ((entityCounts.plants / totalAlive) * 100).toFixed(1)
      : "0";
  const herbivoreRatio =
    totalAlive > 0
      ? ((entityCounts.herbivores / totalAlive) * 100).toFixed(1)
      : "0";
  const carnivoreRatio =
    totalAlive > 0
      ? ((entityCounts.carnivores / totalAlive) * 100).toFixed(1)
      : "0";

  // Format game time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>🌍 Ecosystem Status</Text>

        {/* Health Status Card */}
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Text style={styles.healthEmoji}>
              {getHealthEmoji(ecosystemHealth)}
            </Text>
            <View style={styles.healthInfo}>
              <Text
                style={[
                  styles.healthText,
                  { color: getHealthColor(ecosystemHealth) },
                ]}
              >
                {ecosystemHealth.toUpperCase()}
              </Text>
              <Text style={styles.healthDescription}>
                {getHealthDescription(ecosystemHealth)}
              </Text>
            </View>
          </View>
        </View>

        {/* Entity Counts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entity Counts</Text>

          <View style={styles.countsGrid}>
            <View style={styles.countCard}>
              <Text style={styles.countEmoji}>🌿</Text>
              <Text style={styles.countLabel}>Plants</Text>
              <Text style={styles.countValue}>{entityCounts.plants}</Text>
              <Text style={styles.countRatio}>({plantRatio}%)</Text>
            </View>

            <View style={styles.countCard}>
              <Text style={styles.countEmoji}>🐀</Text>
              <Text style={styles.countLabel}>Herbivores</Text>
              <Text style={styles.countValue}>{entityCounts.herbivores}</Text>
              <Text style={styles.countRatio}>({herbivoreRatio}%)</Text>
            </View>

            <View style={styles.countCard}>
              <Text style={styles.countEmoji}>🕷️</Text>
              <Text style={styles.countLabel}>Carnivores</Text>
              <Text style={styles.countValue}>{entityCounts.carnivores}</Text>
              <Text style={styles.countRatio}>({carnivoreRatio}%)</Text>
            </View>

            <View style={styles.countCard}>
              <Text style={styles.countEmoji}>💀</Text>
              <Text style={styles.countLabel}>Dead</Text>
              <Text style={styles.countValue}>{entityCounts.dead}</Text>
            </View>
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Entities</Text>
            <Text style={styles.totalValue}>{entityCounts.total}</Text>
          </View>
        </View>

        {/* Game Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Time</Text>
          <View style={styles.timeCard}>
            <Text style={styles.timeText}>{formatTime(gameTime)}</Text>
          </View>
        </View>

        {/* Balance Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Analysis</Text>
          <View style={styles.analysisCard}>
            {parseFloat(plantRatio) < 50 && (
              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>Low plant population</Text>
              </View>
            )}

            {parseFloat(herbivoreRatio) > 40 && (
              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>Too many herbivores</Text>
              </View>
            )}

            {parseFloat(carnivoreRatio) > 20 && (
              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>Too many carnivores</Text>
              </View>
            )}

            {entityCounts.dead > entityCounts.total * 0.3 && (
              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>High mortality rate</Text>
              </View>
            )}

            {parseFloat(plantRatio) >= 50 &&
              parseFloat(herbivoreRatio) <= 40 &&
              parseFloat(carnivoreRatio) <= 20 &&
              entityCounts.dead <= entityCounts.total * 0.3 && (
                <View style={styles.healthyItem}>
                  <Text style={styles.healthyIcon}>✅</Text>
                  <Text style={styles.healthyText}>Ecosystem is balanced</Text>
                </View>
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
  healthCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  healthHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthEmoji: {
    fontSize: screenWidth > 768 ? 32 : 28,
    marginRight: 15,
  },
  healthInfo: {
    flex: 1,
  },
  healthText: {
    fontSize: screenWidth > 768 ? 20 : 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  healthDescription: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#94a3b8",
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
  countsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  countCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    flex: 1,
    minWidth: screenWidth > 768 ? 120 : 80,
  },
  countEmoji: {
    fontSize: screenWidth > 768 ? 24 : 20,
    marginBottom: 8,
  },
  countLabel: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 4,
  },
  countValue: {
    fontSize: screenWidth > 768 ? 18 : 16,
    color: "#4ade80",
    fontWeight: "bold",
  },
  countRatio: {
    fontSize: screenWidth > 768 ? 10 : 8,
    color: "#94a3b8",
    marginTop: 2,
  },
  totalCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#cbd5e1",
    fontWeight: "500",
  },
  totalValue: {
    fontSize: screenWidth > 768 ? 18 : 16,
    color: "#4ade80",
    fontWeight: "bold",
  },
  timeCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  timeText: {
    fontSize: screenWidth > 768 ? 24 : 20,
    color: "#4ade80",
    fontWeight: "bold",
  },
  analysisCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  warningIcon: {
    fontSize: screenWidth > 768 ? 16 : 14,
    marginRight: 10,
  },
  warningText: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#fbbf24",
    flex: 1,
  },
  healthyItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthyIcon: {
    fontSize: screenWidth > 768 ? 16 : 14,
    marginRight: 10,
  },
  healthyText: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#4ade80",
    flex: 1,
  },
});

export default EcosystemStatus;
