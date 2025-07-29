import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import GameWorld from "./src/components/GameWorld";
import PlayerStats from "./src/components/PlayerStats";
import EcosystemStatus from "./src/components/EcosystemStatus";
import ActionPanel from "./src/components/ActionPanel";
import { GameProvider } from "./src/context/GameContext";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type TabType = "game" | "stats" | "ecosystem" | "actions";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("game");

  const renderTabContent = () => {
    switch (activeTab) {
      case "game":
        return <GameWorld />;
      case "stats":
        return <PlayerStats />;
      case "ecosystem":
        return <EcosystemStatus />;
      case "actions":
        return <ActionPanel />;
      default:
        return <GameWorld />;
    }
  };

  const TabButton: React.FC<{ tab: TabType; icon: string; label: string }> = ({
    tab,
    icon,
    label,
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabIcon, activeTab === tab && styles.activeTabIcon]}>
        {icon}
      </Text>
      <Text
        style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <GameProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌿 EcoDungeon</Text>
          <Text style={styles.subtitle}>Living Ecosystem</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>{renderTabContent()}</View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TabButton tab="game" icon="🎮" label="Game" />
          <TabButton tab="stats" icon="🧙" label="Player" />
          <TabButton tab="ecosystem" icon="🌍" label="Ecosystem" />
          <TabButton tab="actions" icon="⚡" label="Actions" />
        </View>
      </SafeAreaView>
    </GameProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 15,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  title: {
    fontSize: screenWidth > 768 ? 28 : 24,
    fontWeight: "bold",
    color: "#4ade80",
    textAlign: "center",
  },
  subtitle: {
    fontSize: screenWidth > 768 ? 16 : 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: screenWidth > 768 ? 20 : 10,
    paddingVertical: 10,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: "#334155",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabIcon: {
    fontSize: screenWidth > 768 ? 24 : 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    color: "#4ade80",
  },
  tabLabel: {
    fontSize: screenWidth > 768 ? 12 : 10,
    color: "#94a3b8",
    fontWeight: "500",
  },
  activeTabLabel: {
    color: "#4ade80",
    fontWeight: "bold",
  },
});

export default App;
