"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { addDoc, collection, deleteDoc, doc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { db } from "../../services/firebase"

const { width } = Dimensions.get("window")
const isTablet = width >= 768

interface Reservation {
  id: string
  userId: string
  userNom: string
  userEmail: string
  vehiculeId: string
  vehiculeNom: string
  vehiculeImage?: string
  dateDebut: any
  dateFin: any
  prixTotal: number
  statut: "confirmee" | "en_cours" | "terminee" | "annulee"
  dateReservation: any
  paiementStatut: "en_attente" | "reussi" | "echec"
  nombreJours: number
}

interface User {
  id: string
  nom: string
  prenom: string
  email: string
}

export default function ReservationsPage() {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<User | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState("actives")
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [editData, setEditData] = useState({
    dateDebut: "",
    dateFin: "",
    heureDebut: "",
    heureFin: "",
  })

  const tabs = [
    { key: "actives", label: "Actives", icon: "time", count: 0 },
    { key: "historique", label: "Historique", icon: "archive", count: 0 },
    { key: "toutes", label: "Toutes", icon: "list", count: 0 },
  ]

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (user) {
      loadReservations()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error)
    }
  }

  const loadReservations = async () => {
    if (!user) return

    try {
      console.log("🔍 Chargement des réservations pour l'utilisateur:", user.id)
      const reservationsQuery = query(collection(db, "reservations"), where("userId", "==", user.id))
      const reservationsSnapshot = await getDocs(reservationsQuery)
      const reservationsData = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[]

      console.log("📋 Réservations trouvées:", reservationsData.length)

      // Trier par date de réservation (plus récent en premier)
      reservationsData.sort((a, b) => b.dateReservation.toDate().getTime() - a.dateReservation.toDate().getTime())

      setReservations(reservationsData)

      // Mettre à jour les compteurs des onglets
      updateTabCounts(reservationsData)
    } catch (error) {
      console.error("❌ Erreur lors du chargement des réservations:", error)
      // Données de démonstration si erreur
      const demoData = createDemoReservations()
      setReservations(demoData)
      updateTabCounts(demoData)
    } finally {
      setLoading(false)
    }
  }

  const updateTabCounts = (reservationsData: Reservation[]) => {
    const now = new Date()
    const actives = reservationsData.filter(
      (r) => r.statut === "confirmee" || (r.statut === "en_cours" && r.dateFin.toDate() > now),
    )
    const historique = reservationsData.filter((r) => r.statut === "terminee" || r.statut === "annulee")

    tabs[0].count = actives.length
    tabs[1].count = historique.length
    tabs[2].count = reservationsData.length
  }

  const createDemoReservations = (): Reservation[] => {
    if (!user) return []

    return [
      {
        id: "demo1",
        userId: user.id,
        userNom: `${user.prenom} ${user.nom}`,
        userEmail: user.email,
        vehiculeId: "1",
        vehiculeNom: "BMW X3 Premium",
        vehiculeImage: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&w=300&q=80",
        dateDebut: { toDate: () => new Date("2024-02-20") },
        dateFin: { toDate: () => new Date("2024-02-23") },
        prixTotal: 255000,
        statut: "confirmee",
        dateReservation: { toDate: () => new Date("2024-02-15") },
        paiementStatut: "reussi",
        nombreJours: 3,
      },
      {
        id: "demo2",
        userId: user.id,
        userNom: `${user.prenom} ${user.nom}`,
        userEmail: user.email,
        vehiculeId: "2",
        vehiculeNom: "Audi A4 Executive",
        vehiculeImage: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&w=300&q=80",
        dateDebut: { toDate: () => new Date("2024-01-10") },
        dateFin: { toDate: () => new Date("2024-01-12") },
        prixTotal: 130000,
        statut: "terminee",
        dateReservation: { toDate: () => new Date("2024-01-05") },
        paiementStatut: "reussi",
        nombreJours: 2,
      },
    ]
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadReservations()
    setRefreshing(false)
  }

  const getFilteredReservations = () => {
    const now = new Date()

    switch (selectedTab) {
      case "actives":
        return reservations.filter(
          (r) => r.statut === "confirmee" || (r.statut === "en_cours" && r.dateFin.toDate() > now),
        )
      case "historique":
        return reservations.filter((r) => r.statut === "terminee" || r.statut === "annulee")
      default:
        return reservations
    }
  }

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "confirmee":
        return "#4ECDC4"
      case "en_cours":
        return "#45B7D1"
      case "terminee":
        return "#96CEB4"
      case "annulee":
        return "#FF6B6B"
      default:
        return "#7F8C8D"
    }
  }

  const getStatusText = (statut: string) => {
    switch (statut) {
      case "confirmee":
        return "Confirmée"
      case "en_cours":
        return "En cours"
      case "terminee":
        return "Terminée"
      case "annulee":
        return "Annulée"
      default:
        return statut
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} XAF`
  }

  const formatDate = (date: any) => {
    return date.toDate().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    const dateDebut = reservation.dateDebut.toDate()
    const dateFin = reservation.dateFin.toDate()

    setEditData({
      dateDebut: dateDebut.toISOString().split("T")[0],
      dateFin: dateFin.toISOString().split("T")[0],
      heureDebut: dateDebut.toTimeString().slice(0, 5),
      heureFin: dateFin.toTimeString().slice(0, 5),
    })
    setShowEditModal(true)
  }

  const saveReservationChanges = async () => {
    if (!selectedReservation) return

    try {
      const dateDebut = new Date(editData.dateDebut + "T" + editData.heureDebut)
      const dateFin = new Date(editData.dateFin + "T" + editData.heureFin)

      if (dateDebut >= dateFin) {
        Alert.alert("Erreur", "La date de fin doit être après la date de début")
        return
      }

      if (dateDebut < new Date()) {
        Alert.alert("Erreur", "La date de début ne peut pas être dans le passé")
        return
      }

      const reservationRef = doc(db, "reservations", selectedReservation.id)
      await updateDoc(reservationRef, {
        dateDebut: Timestamp.fromDate(dateDebut),
        dateFin: Timestamp.fromDate(dateFin),
      })

      Alert.alert("Succès", "Réservation modifiée avec succès")
      setShowEditModal(false)
      loadReservations()
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
      Alert.alert("Erreur", "Impossible de modifier la réservation")
    }
  }

  const cancelReservation = async (reservationId: string) => {
    Alert.alert("Annuler la réservation", "Êtes-vous sûr de vouloir annuler cette réservation ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui, annuler",
        style: "destructive",
        onPress: async () => {
          try {
            const reservationRef = doc(db, "reservations", reservationId)
            await updateDoc(reservationRef, {
              statut: "annulee",
            })

            Alert.alert("Succès", "Réservation annulée")
            loadReservations()
          } catch (error) {
            console.error("Erreur lors de l'annulation:", error)
            Alert.alert("Erreur", "Impossible d'annuler la réservation")
          }
        },
      },
    ])
  }

  const deleteReservation = async (reservationId: string) => {
    Alert.alert("Supprimer la réservation", "Cette action est irréversible. Continuer ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "reservations", reservationId))
            Alert.alert("Succès", "Réservation supprimée")
            loadReservations()
          } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            Alert.alert("Erreur", "Impossible de supprimer la réservation")
          }
        },
      },
    ])
  }

  const processPayment = async (reservation: Reservation) => {
    Alert.alert("Paiement", `Montant à payer: ${formatPrice(reservation.prixTotal)}\nProcéder au paiement ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Payer",
        onPress: async () => {
          try {
            // Simuler le paiement
            const paiementData = {
              userId: user?.id,
              reservationId: reservation.id,
              montant: reservation.prixTotal,
              description: `Paiement pour ${reservation.vehiculeNom}`,
              statut: "reussi",
              methode: "carte_bancaire",
              datePaiement: Timestamp.fromDate(new Date()),
              transactionId: `TXN_${Date.now()}`,
              devise: "XAF",
            }

            await addDoc(collection(db, "paiements"), paiementData)

            // Mettre à jour le statut de paiement de la réservation
            const reservationRef = doc(db, "reservations", reservation.id)
            await updateDoc(reservationRef, {
              paiementStatut: "reussi",
            })

            Alert.alert("Succès", "Paiement effectué avec succès !")
            loadReservations()
          } catch (error) {
            console.error("Erreur lors du paiement:", error)
            Alert.alert("Erreur", "Échec du paiement")
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.loadingContainer}>
          <Ionicons name="calendar" size={48} color="white" />
          <Text style={styles.loadingText}>Chargement des réservations...</Text>
        </LinearGradient>
      </View>
    )
  }

  const filteredReservations = getFilteredReservations()

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

      {/* Header amélioré */}
      <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Mes Réservations</Text>
            <Text style={styles.headerSubtitle}>
              {reservations.length} réservation{reservations.length > 1 ? "s" : ""} au total
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push("/(tabs)/vehicles")}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs améliorés */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <View style={styles.tabContent}>
              <Ionicons name={tab.icon as any} size={20} color={selectedTab === tab.key ? "#FF6B6B" : "#7F8C8D"} />
              <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
              {tab.count > 0 && (
                <View style={[styles.tabBadge, selectedTab === tab.key && styles.activeTabBadge]}>
                  <Text style={[styles.tabBadgeText, selectedTab === tab.key && styles.activeTabBadgeText]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des réservations */}
      <ScrollView
        style={styles.reservationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyStateTitle}>Aucune réservation</Text>
            <Text style={styles.emptyStateText}>
              {selectedTab === "actives"
                ? "Vous n'avez pas de réservations actives"
                : "Aucune réservation dans cette catégorie"}
            </Text>
            <TouchableOpacity style={styles.addReservationButton} onPress={() => router.push("/(tabs)/vehicles")}>
              <Ionicons name="car-sport" size={20} color="white" />
              <Text style={styles.addReservationButtonText}>Réserver un véhicule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reservationsContainer}>
            {filteredReservations.map((reservation) => (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationHeader}>
                  <View style={styles.vehicleImageContainer}>
                    {reservation.vehiculeImage && (
                      <Image source={{ uri: reservation.vehiculeImage }} style={styles.vehicleImage} />
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.statut) }]}>
                      <Text style={styles.statusText}>{getStatusText(reservation.statut)}</Text>
                    </View>
                  </View>

                  <View style={styles.reservationInfo}>
                    <Text style={styles.vehicleName}>{reservation.vehiculeNom}</Text>
                    <Text style={styles.reservationPrice}>{formatPrice(reservation.prixTotal)}</Text>
                    <Text style={styles.reservationDuration}>{reservation.nombreJours} jour(s)</Text>
                  </View>
                </View>

                <View style={styles.reservationDetails}>
                  <View style={styles.dateInfo}>
                    <Ionicons name="calendar" size={16} color="#7F8C8D" />
                    <Text style={styles.dateText}>
                      {`Du ${formatDate(reservation.dateDebut)} au ${formatDate(reservation.dateFin)}`}
                    </Text>
                  </View>

                  <View style={styles.paymentInfo}>
                    <Ionicons
                      name={reservation.paiementStatut === "reussi" ? "checkmark-circle" : "time"}
                      size={16}
                      color={reservation.paiementStatut === "reussi" ? "#96CEB4" : "#FFD700"}
                    />
                    <Text style={styles.paymentText}>
                      {`Paiement ${reservation.paiementStatut === "reussi" ? "effectué" : "en attente"}`}
                    </Text>
                  </View>

                  <View style={styles.reservationMeta}>
                    <Text style={styles.reservationDate}>{`Réservé le ${formatDate(reservation.dateReservation)}`}</Text>
                  </View>
                </View>

                <View style={styles.reservationActions}>
                  {reservation.statut === "confirmee" && (
                    <>
                      <TouchableOpacity style={styles.actionButton} onPress={() => handleEditReservation(reservation)}>
                        <Ionicons name="create" size={16} color="#45B7D1" />
                        <Text style={[styles.actionButtonText, { color: "#45B7D1" }]}>Modifier</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.actionButton} onPress={() => cancelReservation(reservation.id)}>
                        <Ionicons name="close-circle" size={16} color="#FF6B6B" />
                        <Text style={[styles.actionButtonText, { color: "#FF6B6B" }]}>Annuler</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {reservation.paiementStatut === "en_attente" && (
                    <TouchableOpacity style={styles.payButton} onPress={() => processPayment(reservation)}>
                      <Ionicons name="card" size={16} color="white" />
                      <Text style={styles.payButtonText}>Payer maintenant</Text>
                    </TouchableOpacity>
                  )}

                  {(reservation.statut === "terminee" || reservation.statut === "annulee") && (
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteReservation(reservation.id)}>
                      <Ionicons name="trash" size={16} color="#FF6B6B" />
                      <Text style={[styles.actionButtonText, { color: "#FF6B6B" }]}>Supprimer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de modification amélioré */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier la réservation</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedReservation && (
                <View style={styles.vehiclePreview}>
                  <Text style={styles.previewTitle}>{selectedReservation.vehiculeNom}</Text>
                  <Text style={styles.previewPrice}>{formatPrice(selectedReservation.prixTotal)}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Date de début</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={editData.dateDebut}
                onChangeText={(text) => setEditData((prev) => ({ ...prev, dateDebut: text }))}
              />

              <Text style={styles.inputLabel}>Heure de début</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="HH:MM"
                value={editData.heureDebut}
                onChangeText={(text) => setEditData((prev) => ({ ...prev, heureDebut: text }))}
              />

              <Text style={styles.inputLabel}>Date de fin</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={editData.dateFin}
                onChangeText={(text) => setEditData((prev) => ({ ...prev, dateFin: text }))}
              />

              <Text style={styles.inputLabel}>Heure de fin</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="HH:MM"
                value={editData.heureFin}
                onChangeText={(text) => setEditData((prev) => ({ ...prev, heureFin: text }))}
              />

              <TouchableOpacity style={styles.saveButton} onPress={saveReservationChanges}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveButtonText}>Sauvegarder les modifications</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  header: {
    paddingBottom: 30,
    paddingHorizontal: isTablet ? 30 : 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "rgba(255,255,255,0.9)",
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: isTablet ? 30 : 20,
    marginTop: -15,
    borderRadius: 20,
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  tab: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 15,
  },
  activeTab: {
    backgroundColor: "#FFF5F5",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  tabBadge: {
    backgroundColor: "#E9ECEF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  activeTabBadge: {
    backgroundColor: "#FF6B6B",
  },
  tabBadgeText: {
    fontSize: 12,
    color: "#7F8C8D",
    fontWeight: "600",
  },
  activeTabBadgeText: {
    color: "white",
  },
  reservationsList: {
    flex: 1,
    paddingHorizontal: isTablet ? 30 : 20,
    paddingTop: 25,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  addReservationButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addReservationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  reservationsContainer: {
    paddingBottom: 30,
  },
  reservationCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  reservationHeader: {
    flexDirection: "row",
    marginBottom: 20,
  },
  vehicleImageContainer: {
    position: "relative",
    marginRight: 15,
  },
  vehicleImage: {
    width: 80,
    height: 60,
    borderRadius: 12,
  },
  statusBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  reservationInfo: {
    flex: 1,
    justifyContent: "center",
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  reservationPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 3,
  },
  reservationDuration: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  reservationDetails: {
    marginBottom: 20,
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  dateText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  paymentText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  reservationMeta: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F4",
  },
  reservationDate: {
    fontSize: 12,
    color: "#BDC3C7",
    fontStyle: "italic",
  },
  reservationActions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#4ECDC4",
    gap: 6,
  },
  payButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF5F5",
    gap: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 25,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F4",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  modalBody: {
    padding: 25,
  },
  vehiclePreview: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  previewPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 10,
    marginTop: 15,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
    color: "#2C3E50",
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
