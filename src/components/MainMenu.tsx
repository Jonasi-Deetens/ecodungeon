import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MainMenuProps {
  onPlayGame: () => void;
  onOptions: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onPlayGame, onOptions }) => {
  return (
    <View style={styles.container}>
      {/* Background with atmospheric elements */}
      <View style={styles.background}>
        <View style={styles.backgroundOverlay} />
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.gameTitle}>🌿 EcoDungeon</Text>
        <Text style={styles.gameSubtitle}>Living Ecosystem RPG</Text>
        <Text style={styles.tagline}>
          Every action shapes the world around you
        </Text>
      </View>

      {/* Menu Buttons */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onPlayGame}
          activeOpacity={0.8}
        >
          <Text style={styles.menuButtonIcon}>⚔️</Text>
          <Text style={styles.menuButtonText}>Play Game</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={onOptions}
          activeOpacity={0.8}
        >
          <Text style={styles.menuButtonIcon}>⚙️</Text>
          <Text style={styles.menuButtonText}>Options</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Explore • Survive • Balance • Thrive
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0f172a",
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
  },
  titleSection: {
    alignItems: "center",
    marginTop: screenHeight * 0.1,
  },
  gameTitle: {
    fontSize: screenWidth > 768 ? 48 : 36,
    fontWeight: "bold",
    color: "#4ade80",
    textAlign: "center",
    textShadowColor: "rgba(74, 222, 128, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  gameSubtitle: {
    fontSize: screenWidth > 768 ? 20 : 16,
    color: "#94a3b8",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 16,
  },
  tagline: {
    fontSize: screenWidth > 768 ? 16 : 14,
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: screenWidth * 0.8,
  },
  menuSection: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderWidth: 2,
    borderColor: "#334155",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 8,
    width: screenWidth > 768 ? 300 : screenWidth * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuButtonText: {
    fontSize: screenWidth > 768 ? 18 : 16,
    fontWeight: "bold",
    color: "#e2e8f0",
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default MainMenu;
