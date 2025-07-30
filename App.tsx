import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { GameProvider } from "./src/context/GameContext";
import MainMenu from "./src/components/MainMenu";
import CharacterSelect from "./src/components/CharacterSelect";
import GameScreen from "./src/components/GameScreen";
import OptionsScreen from "./src/components/OptionsScreen";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type ScreenType = "menu" | "character-select" | "game" | "options";

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("menu");
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    null
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case "menu":
        return (
          <MainMenu
            onPlayGame={() => setCurrentScreen("character-select")}
            onOptions={() => setCurrentScreen("options")}
          />
        );
      case "character-select":
        return (
          <CharacterSelect
            onCharacterSelect={(character) => {
              setSelectedCharacter(character);
              setCurrentScreen("game");
            }}
            onBack={() => setCurrentScreen("menu")}
          />
        );
      case "game":
        return (
          <GameScreen
            selectedCharacter={selectedCharacter}
            onBackToMenu={() => setCurrentScreen("menu")}
          />
        );
      case "options":
        return <OptionsScreen onBack={() => setCurrentScreen("menu")} />;
      default:
        return (
          <MainMenu
            onPlayGame={() => setCurrentScreen("character-select")}
            onOptions={() => setCurrentScreen("options")}
          />
        );
    }
  };

  return (
    <GameProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <ExpoStatusBar style="light" />
        {renderScreen()}
      </SafeAreaView>
    </GameProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
});

export default App;
