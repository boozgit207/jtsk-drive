"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { collection, getDocs, query, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import {
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { db } from "../../services/firebase"
import AuthGuard from "./auth-guard"

const { width } = Dimensions.get("window")
const isTablet = width >= 768
const isSmallScreen = width < 375

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  pointsFidelite?: number
  totalReservations?: number
  totalDepenses?: number
  statut: string
}

interface Reservation {
  id: string
  vehiculeNom: string
  dateDebut: any
  dateFin: any
  statut: string
  prixTotal: number
}

export default function DashboardPage() {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userStats, setUserStats] = useState({
    totalReservations: 0,
    totalDepenses: 0,
    pointsFidelite: 0,
    prochaineReservation: null as string | null,
  })

  useEffect(() => {
    loadUserData()
    const timer = setInterval(() => setCurrentTime(new Date()), 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      loadUserStats()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      const isLoggedIn = await AsyncStorage.getItem("isLoggedIn")

      if (!userData || isLoggedIn !== "true") {
        router.replace("/login")
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error)
      router.replace("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    if (!user) return

    try {
      // Charger les réservations de l'utilisateur
      const reservationsQuery = query(collection(db, "reservations"), where("userId", "==", user.id))
      const reservationsSnapshot = await getDocs(reservationsQuery)
      const reservationsData = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[]

      // Calculer les statistiques
      let totalDepenses = 0
      let prochaineReservation = null
      const now = new Date()

      reservationsData.forEach((reservation) => {
        if (reservation.statut !== "annulee") {
          totalDepenses += reservation.prixTotal || 0
        }

        // Trouver la prochaine réservation
        if (reservation.statut === "confirmee" && reservation.dateDebut.toDate() > now) {
          if (!prochaineReservation || reservation.dateDebut.toDate() < new Date(prochaineReservation)) {
            const diffTime = reservation.dateDebut.toDate().getTime() - now.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            prochaineReservation = `${diffDays}j`
          }
        }
      })

      const pointsFidelite = Math.floor(totalDepenses / 1000) // 1 point par 1000 XAF

      const stats = {
        totalReservations: reservationsData.length,
        totalDepenses,
        pointsFidelite,
        prochaineReservation: prochaineReservation || "Aucune",
      }

      setUserStats(stats)
      setReservations(reservationsData)

      // Mettre à jour les données utilisateur dans AsyncStorage
      const updatedUser = {
        ...user,
        totalReservations: stats.totalReservations,
        totalDepenses: stats.totalDepenses,
        pointsFidelite: stats.pointsFidelite,
      }
      setUser(updatedUser)
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
      // Utiliser des données par défaut en cas d'erreur
      setUserStats({
        totalReservations: 0,
        totalDepenses: 0,
        pointsFidelite: 0,
        prochaineReservation: "Aucune",
      })
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserData()
    if (user) {
      await loadUserStats()
    }
    setRefreshing(false)
  }

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["user", "isLoggedIn", "userId"])
            router.replace("/")
          } catch (error) {
            console.error("Erreur lors de la déconnexion:", error)
          }
        },
      },
    ])
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Bonjour"
    if (hour < 18) return "Bon après-midi"
    return "Bonsoir"
  }

  // Données statiques pour la démo (à remplacer par des données réelles)
  const stats = [
    {
      icon: "car",
      label: "Mes Réservations",
      value: userStats.totalReservations.toString(),
      color: "#FF6B6B",
      route: "/(tabs)/reservations",
    },
    {
      icon: "calendar",
      label: "Prochaine Réservation",
      value: userStats.prochaineReservation || "Aucune",
      color: "#4ECDC4",
      route: "/(tabs)/reservations",
    },
    {
      icon: "card",
      label: "Dépenses totales",
      value: `${userStats.totalDepenses.toLocaleString()} XAF`,
      color: "#45B7D1",
      route: "/(tabs)/profile",
    },
    {
      icon: "star",
      label: "Points Fidélité",
      value: userStats.pointsFidelite.toString(),
      color: "#96CEB4",
      route: "/(tabs)/profile",
    },
  ]

  const quickActions = [
    {
      icon: "add-circle",
      label: "Nouvelle Réservation",
      color: "#FF6B6B",
      route: "/(tabs)/vehicles",
      description: "Réservez un véhicule",
    },
    {
      icon: "car-sport",
      label: "Voir Véhicules",
      color: "#4ECDC4",
      route: "/(tabs)/vehicles",
      description: "Parcourir le catalogue",
    },
    {
      icon: "person",
      label: "Mon Profil",
      color: "#45B7D1",
      route: "/(tabs)/profile",
      description: "Gérer mon compte",
    },
    {
      icon: "help-circle",
      label: "Support",
      color: "#96CEB4",
      route: "/support",
      description: "Aide et assistance",
    },
  ]

  const featuredVehicles = [
    {
      id: 1,
      nom: "BMW X3",
      type: "SUV Premium",
      prix: "85000 XAF/jour",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&w=300&q=80",
      disponible: true,
    },
    {
      id: 2,
      nom: "Audi A4",
      type: "Berline Executive",
      prix: "65000 XAF/jour",
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&w=300&q=80",
      disponible: true,
    },
    {
      id: 3,
      nom: "Mercedes GLC",
      type: "SUV Luxe",
      prix: "95000 XAF/jour",
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&w=300&q=80",
      disponible: false,
    },
  ]

  const recentActivities = [
    {
      icon: "checkmark-circle",
      title: "Réservation confirmée",
      description: "BMW X3 - 15 Jan 2024",
      time: "Il y a 2 heures",
      color: "#96CEB4",
    },
    {
      icon: "car",
      title: "Véhicule rendu",
      description: "Audi A4 - 10 Jan 2024",
      time: "Il y a 5 jours",
      color: "#4ECDC4",
    },
    {
      icon: "star",
      title: "Points gagnés",
      description: `+${Math.floor(userStats.totalDepenses / 1000)} points fidélité`,
      time: "Il y a 1 semaine",
      color: "#FFD700",
    },
    {
      icon: "card",
      title: "Paiement effectué",
      description: `${userStats.totalDepenses.toLocaleString()} XAF - Total dépenses`,
      time: "Il y a 1 semaine",
      color: "#45B7D1",
    },
  ]

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.loadingGradient}>
          <Ionicons name="car-sport" size={48} color="white" />
          <Text style={styles.loadingText}>Chargement de votre dashboard...</Text>
        </LinearGradient>
      </View>
    )
  }

  return (
    <AuthGuard>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

        {/* Header */}
        <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={[styles.greetingText, { fontSize: isTablet ? 18 : 16 }]}>{getGreeting()},</Text>
              <Text style={[styles.userName, { fontSize: isTablet ? 28 : 24 }]}>{`${user?.prenom} ${user?.nom}`}</Text>
              <Text style={[styles.userStatus, { fontSize: isTablet ? 16 : 14 }]}>
                {`Membre ${user?.statut === "actif" ? "Actif" : "Premium"} • ${userStats.pointsFidelite} points`}
              </Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/(tabs)/profile")}>
              <LinearGradient
                colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                style={styles.profileGradient}
              >
                <Ionicons name="person" size={isTablet ? 28 : 24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={() => router.push("/(tabs)/vehicles")}>
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.headerActionText}>Rechercher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="white" />
              <Text style={styles.headerActionText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={[styles.statsSection, { paddingHorizontal: isTablet ? 30 : 20 }]}>
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 24 : 20 }]}>Aperçu</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.statCard, { width: isTablet ? (width - 90) / 4 : (width - 60) / 2 }]}
                onPress={() => router.push(stat.route as any)}
              >
                <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon as any} size={isTablet ? 28 : 24} color="white" />
                </View>
                <Text style={[styles.statValue, { fontSize: isTablet ? 24 : 20 }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { fontSize: isTablet ? 14 : 12 }]}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsSection, { paddingHorizontal: isTablet ? 30 : 20 }]}>
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 24 : 20 }]}>Actions Rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { width: isTablet ? (width - 90) / 4 : (width - 60) / 2 }]}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={isTablet ? 32 : 28} color="white" />
                </View>
                <Text style={[styles.actionLabel, { fontSize: isTablet ? 16 : 14 }]}>{action.label}</Text>
                <Text style={[styles.actionDescription, { fontSize: isTablet ? 12 : 10 }]}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Vehicles */}
        <View style={[styles.vehiclesSection, { paddingHorizontal: isTablet ? 30 : 20 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: isTablet ? 24 : 20 }]}>Véhicules Populaires</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/vehicles")}>
              <Text style={[styles.seeAllText, { fontSize: isTablet ? 16 : 14 }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehiclesScroll}>
            {featuredVehicles.map((vehicle) => (
              <TouchableOpacity key={vehicle.id} style={styles.vehicleCard}>
                <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
                <View style={styles.vehicleInfo}>
                  <Text style={[styles.vehicleName, { fontSize: isTablet ? 18 : 16 }]}>{vehicle.nom}</Text>
                  <Text style={[styles.vehicleType, { fontSize: isTablet ? 14 : 12 }]}>{vehicle.type}</Text>
                  <View style={styles.vehicleFooter}>
                    <Text style={[styles.vehiclePrice, { fontSize: isTablet ? 16 : 14 }]}>{vehicle.prix}</Text>
                    <View
                      style={[
                        styles.availabilityBadge,
                        { backgroundColor: vehicle.disponible ? "#96CEB4" : "#FF6B6B" },
                      ]}
                    >
                      <Text style={styles.availabilityText}>{vehicle.disponible ? "Disponible" : "Occupé"}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={[styles.activitySection, { paddingHorizontal: isTablet ? 30 : 20 }]}>
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 24 : 20 }]}>Activité Récente</Text>
          <View style={styles.activityCard}>
            {recentActivities.map((activity, index) => (
              <View
                key={index}
                style={[styles.activityItem, index === recentActivities.length - 1 && styles.lastActivityItem]}
              >
                <View style={[styles.activityIconContainer, { backgroundColor: activity.color }]}>
                  <Ionicons name={activity.icon as any} size={20} color="white" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { fontSize: isTablet ? 18 : 16 }]}>{activity.title}</Text>
                  <Text style={[styles.activityDescription, { fontSize: isTablet ? 14 : 12 }]}>
                    {activity.description}
                  </Text>
                  <Text style={[styles.activityTime, { fontSize: isTablet ? 12 : 10 }]}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Promotional Banner */}
        <View style={[styles.promoSection, { paddingHorizontal: isTablet ? 30 : 20 }]}>
          <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.promoCard}>
            <View style={styles.promoContent}>
              <Ionicons name="gift" size={isTablet ? 48 : 40} color="white" />
              <View style={styles.promoText}>
                <Text style={[styles.promoTitle, { fontSize: isTablet ? 20 : 18 }]}>Offre Spéciale !</Text>
                <Text style={[styles.promoDescription, { fontSize: isTablet ? 16 : 14 }]}>
                  Réservez 3 véhicules et obtenez 20% de réduction sur votre prochaine location
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={[styles.promoButtonText, { fontSize: isTablet ? 16 : 14 }]}>En savoir plus</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingGradient: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: isTablet ? 18 : 16,
    color: "white",
    fontWeight: "600",
  },
  header: {
    paddingBottom: 30,
    paddingHorizontal: isTablet ? 30 : 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  greetingText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  userName: {
    color: "white",
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 5,
  },
  userStatus: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  profileButton: {
    width: isTablet ? 60 : 50,
    height: isTablet ? 60 : 50,
    borderRadius: isTablet ? 30 : 25,
    overflow: "hidden",
  },
  profileGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 15,
  },
  headerActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  headerActionText: {
    color: "white",
    fontSize: isTablet ? 14 : 12,
    fontWeight: "500",
  },
  statsSection: {
    paddingVertical: isTablet ? 40 : 30,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: isTablet ? 25 : 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isTablet ? 25 : 20,
  },
  seeAllText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: isTablet ? 20 : 15,
  },
  statCard: {
    backgroundColor: "white",
    padding: isTablet ? 25 : 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statIcon: {
    width: isTablet ? 60 : 50,
    height: isTablet ? 60 : 50,
    borderRadius: isTablet ? 30 : 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  statLabel: {
    color: "#7F8C8D",
    textAlign: "center",
  },
  actionsSection: {
    paddingVertical: isTablet ? 30 : 20,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: isTablet ? 20 : 15,
  },
  actionCard: {
    backgroundColor: "white",
    padding: isTablet ? 25 : 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionIcon: {
    width: isTablet ? 70 : 60,
    height: isTablet ? 70 : 60,
    borderRadius: isTablet ? 35 : 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionLabel: {
    color: "#2C3E50",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  actionDescription: {
    color: "#7F8C8D",
    textAlign: "center",
  },
  vehiclesSection: {
    paddingVertical: isTablet ? 30 : 20,
  },
  vehiclesScroll: {
    paddingLeft: 0,
  },
  vehicleCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginRight: 15,
    width: isTablet ? 280 : 220,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  vehicleImage: {
    width: "100%",
    height: isTablet ? 160 : 120,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  vehicleInfo: {
    padding: isTablet ? 20 : 15,
  },
  vehicleName: {
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  vehicleType: {
    color: "#7F8C8D",
    marginBottom: 10,
  },
  vehicleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehiclePrice: {
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  availabilityText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  activitySection: {
    paddingVertical: isTablet ? 30 : 20,
  },
  activityCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: isTablet ? 25 : 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F4",
  },
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 3,
  },
  activityDescription: {
    color: "#7F8C8D",
    marginBottom: 3,
  },
  activityTime: {
    color: "#BDC3C7",
    fontStyle: "italic",
  },
  promoSection: {
    paddingVertical: isTablet ? 30 : 20,
    paddingBottom: 40,
  },
  promoCard: {
    borderRadius: 15,
    padding: isTablet ? 25 : 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  promoText: {
    marginLeft: 15,
    flex: 1,
  },
  promoTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  promoDescription: {
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  promoButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 15,
  },
  promoButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
