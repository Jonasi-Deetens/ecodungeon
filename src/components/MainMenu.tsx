import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MainMenuProps {
  onPlayGame: () => void;
  onOptions: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onPlayGame, onOptions }) => {
  const [titleParticles, setTitleParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      opacity: number;
      size: number;
      angle: number;
      radius: number;
    }>
  >([]);
  const [chaseDirection, setChaseDirection] = useState<"right" | "left">(
    "right"
  );
  const [chasePosition, setChasePosition] = useState(0);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Animated values for effects
  const titleGlow = new Animated.Value(0.3);
  const backgroundPulse = new Animated.Value(1);

  // Chase animation
  useEffect(() => {
    const interval = setInterval(() => {
      setChasePosition((prev) => {
        const speed = 2;
        let newPosition = prev;

        if (chaseDirection === "right") {
          newPosition += speed;
          // Let them go partially off-screen before turning
          if (newPosition >= screenWidth + 40) {
            setChaseDirection("left");
          }
        } else {
          newPosition -= speed;
          // Let them go partially off-screen before turning
          if (newPosition <= -100) {
            setChaseDirection("right");
          }
        }

        return newPosition;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [chaseDirection]);

  // Title area particle animation
  useEffect(() => {
    const titleCenterX = screenWidth / 2;
    const titleCenterY = screenHeight * 0.15; // Approximate title position

    const interval = setInterval(() => {
      setTitleParticles((prev) => {
        // Add new title particles
        const newParticles = [...prev];
        if (newParticles.length < 15) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 100 + 50; // 50-150px from center
          newParticles.push({
            id: Date.now() + Math.random(),
            x: titleCenterX + Math.cos(angle) * radius,
            y: titleCenterY + Math.sin(angle) * radius,
            opacity: 0.8,
            size: Math.random() * 2 + 1,
            angle: angle,
            radius: radius,
          });
        }

        // Update existing title particles - they orbit around the title
        return newParticles
          .map((particle) => ({
            ...particle,
            angle: particle.angle + 0.02, // Slow rotation
            x: titleCenterX + Math.cos(particle.angle) * particle.radius,
            y: titleCenterY + Math.sin(particle.angle) * particle.radius,
            opacity: particle.opacity - 0.003, // Slower fade
          }))
          .filter((particle) => particle.opacity > 0);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Title glow animation
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(titleGlow, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();

    return () => glowAnimation.stop();
  }, [titleGlow]);

  // Background pulse animation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse, {
          toValue: 1.1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundPulse, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [backgroundPulse]);

  return (
    <View style={styles.container}>
      {/* Background with atmospheric elements */}
      <View style={styles.background}>
        <Animated.View
          style={[
            styles.backgroundOverlay,
            {
              opacity: backgroundPulse,
            },
          ]}
        />

        {/* Title area particles */}
        <View style={styles.titleParticlesContainer}>
          {titleParticles.map((particle) => (
            <View
              key={particle.id}
              style={[
                styles.titleParticle,
                {
                  left: particle.x,
                  top: particle.y,
                  opacity: particle.opacity,
                  width: particle.size,
                  height: particle.size,
                  borderRadius: particle.size / 2,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Animated.Text
          style={[
            styles.gameTitle,
            {
              textShadowColor: `rgba(74, 222, 128, ${titleGlow})`,
            },
          ]}
        >
          🌿 EcoDungeon
        </Animated.Text>
        <Text style={styles.gameSubtitle}>Living Ecosystem RPG</Text>
        <Text style={styles.tagline}>
          Every action shapes the world around you
        </Text>
      </View>

      {/* Menu Buttons */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={[
            styles.menuButton,
            hoveredButton === "play" && styles.menuButtonHovered,
          ]}
          onPress={onPlayGame}
          activeOpacity={0.8}
          onPressIn={() => setHoveredButton("play")}
          onPressOut={() => setHoveredButton(null)}
        >
          <View style={styles.menuButtonContent}>
            <Text style={styles.menuButtonIcon}>⚔️</Text>
            <Text style={styles.menuButtonText}>Play Game</Text>
          </View>
          <View style={styles.menuButtonGlow} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuButton,
            hoveredButton === "options" && styles.menuButtonHovered,
          ]}
          onPress={onOptions}
          activeOpacity={0.8}
          onPressIn={() => setHoveredButton("options")}
          onPressOut={() => setHoveredButton(null)}
        >
          <View style={styles.menuButtonContent}>
            <Text style={styles.menuButtonIcon}>⚙️</Text>
            <Text style={styles.menuButtonText}>Options</Text>
          </View>
          <View style={styles.menuButtonGlow} />
        </TouchableOpacity>
      </View>

      {/* Grass Bar with Chase Animation */}
      <View style={styles.grassBar}>
        {/* Chase Animation - Above the text */}
        <View style={styles.chaseContainer}>
          {/* Rabbit */}
          <View
            style={[
              styles.rabbit,
              {
                left: chasePosition + (chaseDirection === "right" ? 60 : -60),
                transform: [{ scaleX: chaseDirection === "right" ? 1 : -1 }],
              },
            ]}
          >
            <Text style={styles.rabbitIcon}>🐰</Text>
          </View>

          {/* Wolf */}
          <View
            style={[
              styles.wolf,
              {
                left: chasePosition,
                transform: [{ scaleX: chaseDirection === "left" ? 1 : -1 }],
              },
            ]}
          >
            <Text style={styles.wolfIcon}>🐺</Text>
          </View>
        </View>

        {/* Text at the bottom of the grass bar */}
        <Text style={styles.grassBarText}>
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
    paddingTop: 40,
    paddingBottom: 220, // Account for the grass bar height
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0f172a",
    // Add gradient-like effect with multiple layers
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
    position: "relative",
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
    overflow: "hidden",
  },
  menuButtonHovered: {
    borderColor: "#4ade80",
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    shadowColor: "#4ade80",
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  menuButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  menuButtonGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: 12,
    zIndex: 1,
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
  grassBar: {
    position: "absolute",
    bottom: -40, // Extend beyond any container padding
    left: 0,
    right: 0,
    height: 160,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 0,
    paddingBottom: 0,
  },
  grassBarText: {
    fontSize: screenWidth > 768 ? 16 : 14,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
    marginBottom: 60,
  },
  chaseContainer: {
    position: "absolute", // Increase height to compensate for negative bottom
    backgroundColor: "#16a34a",
    borderBottomWidth: 2,
    borderBottomColor: "#15803d",
    borderTopWidth: 2,
    borderTopColor: "#15803d",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  rabbit: {
    position: "absolute",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  rabbitIcon: {
    fontSize: 32,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wolf: {
    position: "absolute",
    bottom: 0,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  wolfIcon: {
    fontSize: 32,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  particlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  particle: {
    position: "absolute",
    backgroundColor: "#4ade80",
    shadowColor: "#4ade80",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  titleParticlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 1,
  },
  titleParticle: {
    position: "absolute",
    backgroundColor: "#4ade80",
    shadowColor: "#4ade80",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default MainMenu;
