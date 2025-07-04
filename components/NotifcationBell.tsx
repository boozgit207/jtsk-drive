"use client"

import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface NotificationBellProps {
  count: number
  onPress: () => void
}

export default function NotificationBell({ count, onPress }: NotificationBellProps) {
  const [shakeAnimation] = useState(new Animated.Value(0))
  const [pulseAnimation] = useState(new Animated.Value(1))

  useEffect(() => {
    if (count > 0) {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    }
  }, [count])

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Animated.View
        style={[
          styles.bellContainer,
          {
            transform: [{ translateX: shakeAnimation }, { scale: pulseAnimation }],
          },
        ]}
      >
        <Ionicons name="notifications" size={24} color={count > 0 ? "#FF6B6B" : "#666"} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  bellContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
})
