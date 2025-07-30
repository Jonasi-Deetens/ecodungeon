import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface JoystickProps {
  onMove: (direction: { x: number; y: number }) => void;
  size?: number;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, size = 120 }) => {
  const [isActive, setIsActive] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const joystickRef = useRef<View>(null);

  const maxDistance = size * 0.4; // Maximum distance the joystick can move
  const centerPosition = { x: 0, y: 0 };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsActive(true);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= maxDistance) {
          // Within the joystick range
          pan.setValue({ x: dx, y: dy });
        } else {
          // Limit to max distance
          const angle = Math.atan2(dy, dx);
          const limitedX = Math.cos(angle) * maxDistance;
          const limitedY = Math.sin(angle) * maxDistance;
          pan.setValue({ x: limitedX, y: limitedY });
        }

        // Calculate normalized direction
        const normalizedX = (pan.x as any)._value / maxDistance;
        const normalizedY = (pan.y as any)._value / maxDistance;

        onMove({ x: normalizedX, y: normalizedY });
      },
      onPanResponderRelease: () => {
        setIsActive(false);
        pan.flattenOffset();

        // Animate back to center
        Animated.spring(pan, {
          toValue: centerPosition,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();

        // Stop movement
        onMove({ x: 0, y: 0 });
      },
    })
  ).current;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ring */}
      <View style={[styles.outerRing, { width: size, height: size }]} />

      {/* Inner joystick */}
      <Animated.View
        ref={joystickRef}
        style={[
          styles.innerJoystick,
          {
            width: size * 0.4,
            height: size * 0.4,
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
            backgroundColor: isActive ? "#4ade80" : "#64748b",
          },
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#334155",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
  },
  innerJoystick: {
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default Joystick;
