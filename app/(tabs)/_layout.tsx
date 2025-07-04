"use client"
import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0A84FF",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Véhicules",
          tabBarIcon: ({ color, size }) => <Ionicons name="car-sport" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: "Réservations",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
