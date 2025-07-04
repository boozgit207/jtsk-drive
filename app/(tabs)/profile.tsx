"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import {
    Alert,
    Dimensions,
    Image,
    Modal,
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

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  dateNaissance?: string
  adresse?: string
  permisConduire?: string
  photoProfil?: string
  pointsFidelite?: number
  totalReservations?: number
  totalDepenses?: number
  statut: string
}

interface UserStats {
  reservations: number
  depenses: number
  points: number
  vehiculesPreferes: string[]
}

export default function ProfilePage() {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    reservations: 0,
    depenses: 0,
    points: 0,
    vehiculesPreferes: [],
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [editData, setEditData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    dateNaissance: "",
    adresse: "",
    permisConduire: "",
  })

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserStats()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setEditData({
          nom: parsedUser.nom || "",
          prenom: parsedUser.prenom || "",
          telephone: parsedUser.telephone || "",
          dateNaissance: parsedUser.dateNaissance || "",
          adresse: parsedUser.adresse || "",
          permisConduire: parsedUser.permisConduire || "",
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    if (!user) return

    try {
      // Charger les statistiques depuis les réservations
      const reservationsQuery = query(collection(db, "reservations"), where("userId", "==", user.id))
      const reservationsSnapshot = await getDocs(reservationsQuery)

      let totalDepenses = 0
      const reservations = reservationsSnapshot.docs.map((doc) => doc.data())

      reservations.forEach((reservation: any) => {
        if (reservation.paiementStatut === "reussi") {
          totalDepenses += reservation.prixTotal || 0
        }
      })

      // Charger les paiements
      const paiementsQuery = query(collection(db, "paiements"), where("userId", "==", user.id))
      const paiementsSnapshot = await getDocs(paiementsQuery)

      setUserStats({
        reservations: reservationsSnapshot.size,
        depenses: totalDepenses,
        points: user.pointsFidelite || Math.floor(totalDepenses * 10), // 10 points par euro dépensé
        vehiculesPreferes: ["BMW X3", "Audi A4"], // Données statiques pour la démo
      })
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission requise", "Nous avons besoin d'accéder à vos photos")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`
      await updateProfilePhoto(base64Image)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission requise", "Nous avons besoin d'accéder à votre caméra")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`
      await updateProfilePhoto(base64Image)
    }
  }

  const updateProfilePhoto = async (photoBase64: string) => {
    if (!user) return

    try {
      const userRef = doc(db, "utilisateurs", user.id)
      await updateDoc(userRef, {
        photoProfil: photoBase64,
      })

      const updatedUser = { ...user, photoProfil: photoBase64 }
      setUser(updatedUser)
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))

      Alert.alert("Succès", "Photo de profil mise à jour !")
      setShowImageModal(false)
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la photo:", error)
      Alert.alert("Erreur", "Impossible de mettre à jour la photo")
    }
  }

  const saveProfile = async () => {
    if (!user) return

    try {
      const userRef = doc(db, "utilisateurs", user.id)
      await updateDoc(userRef, {
        nom: editData.nom,
        prenom: editData.prenom,
        telephone: editData.telephone,
        dateNaissance: editData.dateNaissance,
        adresse: editData.adresse,
        permisConduire: editData.permisConduire,
      })

      const updatedUser = { ...user, ...editData }
      setUser(updatedUser)
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))

      Alert.alert("Succès", "Profil mis à jour avec succès !")
      setEditing(false)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      Alert.alert("Erreur", "Impossible de mettre à jour le profil")
    }
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="person" size={48} color="#FF6B6B" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

      {/* Header */}
      <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={() => setShowImageModal(true)}>
            {user?.photoProfil ? (
              <Image source={{ uri: user.photoProfil }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={isTablet ? 40 : 32} color="white" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { fontSize: isTablet ? 28 : 24 }]}>
              {user?.prenom} {user?.nom}
            </Text>
            <Text style={[styles.userEmail, { fontSize: isTablet ? 16 : 14 }]}>{user?.email}</Text>
            <View style={styles.userBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.userBadgeText}>Membre {user?.statut === "actif" ? "Premium" : "Standard"}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={() => setEditing(!editing)}>
            <Ionicons name={editing ? "checkmark" : "create"} size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiques */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 22 : 20 }]}>Mes Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="car" size={24} color="#FF6B6B" />
              <Text style={styles.statValue}>{userStats.reservations}</Text>
              <Text style={styles.statLabel}>Réservations</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="card" size={24} color="#4ECDC4" />
              <Text style={styles.statValue}>€{userStats.depenses}</Text>
              <Text style={styles.statLabel}>Dépenses</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{userStats.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 22 : 20 }]}>Informations Personnelles</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#7F8C8D" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nom</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editData.nom}
                    onChangeText={(text) => setEditData((prev) => ({ ...prev, nom: text }))}
                    placeholder="Votre nom"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.nom || "Non renseigné"}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#7F8C8D" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Prénom</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editData.prenom}
                    onChangeText={(text) => setEditData((prev) => ({ ...prev, prenom: text }))}
                    placeholder="Votre prénom"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.prenom || "Non renseigné"}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#7F8C8D" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#7F8C8D" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editData.telephone}
                    onChangeText={(text) => setEditData((prev) => ({ ...prev, telephone: text }))}
                    placeholder="Votre téléphone"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.telephone || "Non renseigné"}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#7F8C8D" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date de naissance</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editData.dateNaissance}
                    onChangeText={(text) => setEditData((prev) => ({ ...prev, dateNaissance: text }))}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.dateNaissance || "Non renseigné"}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#7F8C8D" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Adresse</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editData.adresse}
                    onChangeText={(text) => setEditData((prev) => ({ ...prev, adresse: text }))}
                    placeholder="Votre adresse"
                    multiline
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.adresse || "Non renseigné"}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="card" size={20} color="#7F8C8D" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Permis de conduire</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editData.permisConduire}
                    onChangeText={(text) => setEditData((prev) => ({ ...prev, permisConduire: text }))}
                    placeholder="Numéro de permis"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.permisConduire || "Non renseigné"}</Text>
                )}
              </View>
            </View>
          </View>

          {editing && (
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Sauvegarder les modifications</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 22 : 20 }]}>Actions</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(tabs)/reservations")}>
            <Ionicons name="calendar" size={24} color="#4ECDC4" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mes Réservations</Text>
              <Text style={styles.actionDescription}>Gérer mes réservations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(tabs)/vehicles")}>
            <Ionicons name="car-sport" size={24} color="#45B7D1" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Véhicules</Text>
              <Text style={styles.actionDescription}>Parcourir le catalogue</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle" size={24} color="#96CEB4" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Support</Text>
              <Text style={styles.actionDescription}>Aide et assistance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#FF6B6B" />
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: "#FF6B6B" }]}>Déconnexion</Text>
              <Text style={styles.actionDescription}>Se déconnecter du compte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de sélection d'image */}
      <Modal visible={showImageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.imageModalContent}>
            <Text style={styles.modalTitle}>Changer la photo de profil</Text>

            <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#FF6B6B" />
              <Text style={styles.imageOptionText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
              <Ionicons name="images" size={24} color="#4ECDC4" />
              <Text style={styles.imageOptionText}>Choisir depuis la galerie</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowImageModal(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7F8C8D",
  },
  header: {
    paddingBottom: 30,
    paddingHorizontal: isTablet ? 30 : 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    borderRadius: isTablet ? 50 : 40,
    borderWidth: 3,
    borderColor: "white",
  },
  profileImagePlaceholder: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    borderRadius: isTablet ? 50 : 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF6B6B",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  userEmail: {
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: "flex-start",
    gap: 5,
  },
  userBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 30 : 20,
  },
  statsSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statValue: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "center",
  },
  infoSection: {
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F4",
    gap: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: "#2C3E50",
    fontWeight: "500",
  },
  infoInput: {
    fontSize: 16,
    color: "#2C3E50",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#F8F9FA",
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  actionsSection: {
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: 15,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#FFE5E5",
    backgroundColor: "#FFF5F5",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 3,
  },
  actionDescription: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  imageModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 30,
  },
  imageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
    backgroundColor: "#F8F9FA",
    marginBottom: 15,
    gap: 15,
  },
  imageOptionText: {
    fontSize: 16,
    color: "#2C3E50",
    fontWeight: "500",
  },
  cancelButton: {
    padding: 20,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#7F8C8D",
    fontWeight: "500",
  },
})
