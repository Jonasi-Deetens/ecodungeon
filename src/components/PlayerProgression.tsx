import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Player } from "../types/gameTypes";

const { width: screenWidth } = Dimensions.get("window");

interface PlayerProgressionProps {
  player: Player;
  onSkillAllocation?: (skill: "observation" | "restoration") => void;
}

const PlayerProgression: React.FC<PlayerProgressionProps> = ({
  player,
  onSkillAllocation,
}) => {
  const [showSkillAllocation, setShowSkillAllocation] = useState(false);

  const experienceProgress =
    (player.experience / player.experienceToNextLevel) * 100;

  const handleSkillAllocation = (skill: "observation" | "restoration") => {
    if (player.allocateSkillPoint(skill)) {
      onSkillAllocation?.(skill);
    }
  };

  return (
    <View style={styles.container}>
      {/* Level and Experience */}
      <View style={styles.levelSection}>
        <Text style={styles.levelText}>Level {player.level}</Text>
        <View style={styles.experienceBar}>
          <View style={styles.experienceBarBackground}>
            <View
              style={[
                styles.experienceBarFill,
                { width: `${experienceProgress}%` },
              ]}
            />
          </View>
          <Text style={styles.experienceText}>
            {player.experience} / {player.experienceToNextLevel} XP
          </Text>
        </View>
      </View>

      {/* Skill Points */}
      <View style={styles.skillPointsSection}>
        <Text style={styles.skillPointsText}>
          Skill Points: {player.skillPoints}
        </Text>
        {player.skillPoints > 0 && (
          <TouchableOpacity
            style={styles.allocateButton}
            onPress={() => setShowSkillAllocation(!showSkillAllocation)}
          >
            <Text style={styles.allocateButtonText}>
              {showSkillAllocation ? "Cancel" : "Allocate Skills"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Skills Display */}
      <View style={styles.skillsSection}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsGrid}>
          <View style={styles.skillItem}>
            <Text style={styles.skillLabel}>Observation</Text>
            <Text style={styles.skillValue}>{player.observationSkill}</Text>
            {showSkillAllocation && player.skillPoints > 0 && (
              <TouchableOpacity
                style={styles.skillButton}
                onPress={() => handleSkillAllocation("observation")}
              >
                <Text style={styles.skillButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.skillItem}>
            <Text style={styles.skillLabel}>Restoration</Text>
            <Text style={styles.skillValue}>{player.restorationSkill}</Text>
            {showSkillAllocation && player.skillPoints > 0 && (
              <TouchableOpacity
                style={styles.skillButton}
                onPress={() => handleSkillAllocation("restoration")}
              >
                <Text style={styles.skillButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Level Up Notification */}
      {player.skillPoints > 0 && (
        <View style={styles.levelUpNotification}>
          <Text style={styles.levelUpText}>
            🎉 Level Up! You have {player.skillPoints} skill point
            {player.skillPoints > 1 ? "s" : ""} to allocate!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginVertical: 8,
  },
  levelSection: {
    marginBottom: 12,
  },
  levelText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4ade80",
    textAlign: "center",
    marginBottom: 8,
  },
  experienceBar: {
    alignItems: "center",
  },
  experienceBarBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  experienceBarFill: {
    height: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 4,
  },
  experienceText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  skillPointsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  skillPointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e2e8f0",
  },
  allocateButton: {
    backgroundColor: "#4ade80",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  allocateButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  skillsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 8,
  },
  skillsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skillItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#334155",
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  skillLabel: {
    fontSize: 12,
    color: "#e2e8f0",
    flex: 1,
  },
  skillValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4ade80",
    marginHorizontal: 8,
  },
  skillButton: {
    backgroundColor: "#4ade80",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  skillButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  levelUpNotification: {
    backgroundColor: "rgba(74, 222, 128, 0.2)",
    borderWidth: 1,
    borderColor: "#4ade80",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  levelUpText: {
    fontSize: 12,
    color: "#4ade80",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default PlayerProgression;
