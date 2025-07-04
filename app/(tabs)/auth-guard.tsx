"use client"

import type React from "react"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log("🔍 Vérification de l'authentification...")

      const [userData, loginStatus] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("isLoggedIn"),
      ])

      console.log("📱 Données AsyncStorage:", {
        hasUser: !!userData,
        loginStatus,
        userPreview: userData ? JSON.parse(userData).email : null,
      })

      if (userData && loginStatus === "true") {
        console.log("✅ Utilisateur authentifié")
        setIsAuthenticated(true)
      } else {
        console.log("❌ Utilisateur non authentifié, redirection vers login")
        setIsAuthenticated(false)
        router.replace("/login")
      }
    } catch (error) {
      console.error("💥 Erreur lors de la vérification d'authentification:", error)
      setIsAuthenticated(false)
      router.replace("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.loadingContainer}>
          <Ionicons name="car-sport" size={48} color="white" />
          <Text style={styles.loadingText}>Vérification de l'authentification...</Text>
        </LinearGradient>
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Redirection en cours...</Text>
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#7F8C8D",
  },
})
