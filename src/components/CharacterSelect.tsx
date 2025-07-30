import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface CharacterSelectProps {
  onCharacterSelect: (character: string) => void;
  onBack: () => void;
}

interface CharacterClass {
  id: string;
  name: string;
  icon: string;
  description: string;
  stats: {
    health: number;
    energy: number;
    ecoImpact: number;
    observationSkill: number;
    restorationSkill: number;
  };
  abilities: string[];
}

const characterClasses: CharacterClass[] = [
  {
    id: "ecologist",
    name: "Ecologist",
    icon: "🌱",
    description:
      "A scholar of nature who understands the delicate balance of ecosystems. Excels at observation and restoration.",
    stats: {
      health: 150,
      energy: 120,
      ecoImpact: 5,
      observationSkill: 3,
      restorationSkill: 3,
    },
    abilities: [
      "Enhanced Observation",
      "Ecosystem Analysis",
      "Gentle Restoration",
    ],
  },
  {
    id: "ranger",
    name: "Ranger",
    icon: "🏹",
    description:
      "A skilled hunter and tracker who moves silently through the wilderness. Balanced combat and survival skills.",
    stats: {
      health: 180,
      energy: 100,
      ecoImpact: 0,
      observationSkill: 2,
      restorationSkill: 1,
    },
    abilities: ["Silent Movement", "Precise Attacks", "Wilderness Survival"],
  },
  {
    id: "guardian",
    name: "Guardian",
    icon: "🛡️",
    description:
      "A protector of nature who wields both weapon and healing magic. Strong defensive capabilities.",
    stats: {
      health: 200,
      energy: 80,
      ecoImpact: 2,
      observationSkill: 1,
      restorationSkill: 4,
    },
    abilities: ["Nature's Protection", "Healing Touch", "Defensive Stance"],
  },
  {
    id: "wanderer",
    name: "Wanderer",
    icon: "🧭",
    description:
      "A nomadic explorer who adapts to any environment. Versatile skills and high mobility.",
    stats: {
      health: 160,
      energy: 140,
      ecoImpact: 1,
      observationSkill: 2,
      restorationSkill: 2,
    },
    abilities: ["Adaptive Movement", "Quick Learning", "Resourceful"],
  },
];

const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onCharacterSelect,
  onBack,
}) => {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterClass | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Character</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Character Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.characterGrid}>
          {characterClasses.map((character) => (
            <TouchableOpacity
              key={character.id}
              style={[
                styles.characterCard,
                selectedCharacter?.id === character.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedCharacter(character)}
              activeOpacity={0.8}
            >
              <Text style={styles.characterIcon}>{character.icon}</Text>
              <Text style={styles.characterName}>{character.name}</Text>
              <Text style={styles.characterDescription} numberOfLines={3}>
                {character.description}
              </Text>

              {/* Stats Preview */}
              <View style={styles.statsPreview}>
                <Text style={styles.statsLabel}>Stats:</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statText}>
                    ❤️ {character.stats.health}
                  </Text>
                  <Text style={styles.statText}>
                    ⚡ {character.stats.energy}
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statText}>
                    🌿 {character.stats.ecoImpact}
                  </Text>
                  <Text style={styles.statText}>
                    👁️ {character.stats.observationSkill}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Character Details */}
        {selectedCharacter && (
          <View style={styles.characterDetails}>
            <Text style={styles.detailsTitle}>
              {selectedCharacter.name} Details
            </Text>

            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Base Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Health</Text>
                  <Text style={styles.statValue}>
                    {selectedCharacter.stats.health}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Energy</Text>
                  <Text style={styles.statValue}>
                    {selectedCharacter.stats.energy}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Eco Impact</Text>
                  <Text style={styles.statValue}>
                    {selectedCharacter.stats.ecoImpact}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Observation</Text>
                  <Text style={styles.statValue}>
                    {selectedCharacter.stats.observationSkill}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Restoration</Text>
                  <Text style={styles.statValue}>
                    {selectedCharacter.stats.restorationSkill}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.abilitiesSection}>
              <Text style={styles.sectionTitle}>Abilities</Text>
              {selectedCharacter.abilities.map((ability, index) => (
                <View key={index} style={styles.abilityItem}>
                  <Text style={styles.abilityText}>• {ability}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Select Button */}
      {selectedCharacter && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => onCharacterSelect(selectedCharacter.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.selectButtonText}>
              Play as {selectedCharacter.name}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e2e8f0",
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  characterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  characterCard: {
    width: screenWidth > 768 ? (screenWidth - 80) / 2 : (screenWidth - 60) / 2,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#334155",
  },
  selectedCard: {
    borderColor: "#4ade80",
    backgroundColor: "#1e3a2a",
  },
  characterIcon: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: 8,
  },
  characterName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e2e8f0",
    textAlign: "center",
    marginBottom: 8,
  },
  characterDescription: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 16,
  },
  statsPreview: {
    alignItems: "center",
  },
  statsLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  characterDetails: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e2e8f0",
    textAlign: "center",
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: "#334155",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4ade80",
  },
  abilitiesSection: {
    marginBottom: 20,
  },
  abilityItem: {
    marginBottom: 8,
  },
  abilityText: {
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectButton: {
    backgroundColor: "#4ade80",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
});

export default CharacterSelect;
