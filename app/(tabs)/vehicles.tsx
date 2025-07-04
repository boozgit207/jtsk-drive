"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore"
import { useEffect, useState } from "react"
import {
    Alert,
    Dimensions,
    FlatList,
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

interface Vehicle {
  id: string
  nom: string
  marque: string
  type: string
  prix: number
  description: string
  image: string
  disponible: boolean
  caracteristiques: {
    carburant: string
    transmission: string
    places: number
    climatisation: boolean
  }
  dateAjout: any
}

interface User {
  id: string
  nom: string
  prenom: string
  email: string
}

export default function VehiclesPage() {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<User | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("Tous")
  const [priceRange, setPriceRange] = useState("Tous")
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)

  // États pour la réservation
  const [reservationData, setReservationData] = useState({
    dateDebut: "",
    dateFin: "",
    heureDebut: "09:00",
    heureFin: "18:00",
  })

  // États pour ajouter un véhicule
  const [newVehicle, setNewVehicle] = useState({
    nom: "",
    marque: "",
    type: "Berline",
    prix: "",
    description: "",
    image: "",
    carburant: "Essence",
    transmission: "Manuelle",
    places: "5",
    climatisation: true,
  })

  const filters = ["Tous", "Berline", "SUV", "Sportive", "Utilitaire", "Électrique", "4x4"]
  const priceFilters = ["Tous", "0-50000", "50000-100000", "100000-200000", "200000+"]
  const marques = ["BMW", "Audi", "Mercedes", "Peugeot", "Renault", "Volkswagen", "Toyota", "Nissan", "Ford"]

  useEffect(() => {
    loadUserData()
    loadVehicles()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [vehicles, searchQuery, selectedFilter, priceRange])

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

  const loadVehicles = async () => {
    try {
      const vehiclesSnapshot = await getDocs(collection(db, "vehicules"))
      const vehiclesData = vehiclesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Vehicle[]

      if (vehiclesData.length === 0) {
        // Utiliser les données de démonstration si aucun véhicule en base
        setVehicles(demoVehicles)
      } else {
        setVehicles(vehiclesData)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des véhicules:", error)
      // Données de démonstration si erreur
      setVehicles(demoVehicles)
    } finally {
      setLoading(false)
    }
  }

  const filterVehicles = () => {
    let filtered = vehicles

    // Filtre par type
    if (selectedFilter !== "Tous") {
      filtered = filtered.filter((vehicle) => vehicle.type === selectedFilter)
    }

    // Filtre par prix
    if (priceRange !== "Tous") {
      filtered = filtered.filter((vehicle) => {
        const prix = vehicle.prix
        switch (priceRange) {
          case "0-50000":
            return prix <= 50000
          case "50000-100000":
            return prix > 50000 && prix <= 100000
          case "100000-200000":
            return prix > 100000 && prix <= 200000
          case "200000+":
            return prix > 200000
          default:
            return true
        }
      })
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.marque.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.type.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredVehicles(filtered)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadVehicles()
    setRefreshing(false)
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
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets[0].base64) {
      setNewVehicle((prev) => ({
        ...prev,
        image: `data:image/jpeg;base64,${result.assets[0].base64}`,
      }))
    }
  }

  const addVehicle = async () => {
    if (!newVehicle.nom || !newVehicle.marque || !newVehicle.prix) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      const vehicleData = {
        nom: newVehicle.nom,
        marque: newVehicle.marque,
        type: newVehicle.type,
        prix: Number.parseFloat(newVehicle.prix),
        description: newVehicle.description,
        image: newVehicle.image || "https://via.placeholder.com/400x200?text=Véhicule",
        disponible: true,
        caracteristiques: {
          carburant: newVehicle.carburant,
          transmission: newVehicle.transmission,
          places: Number.parseInt(newVehicle.places),
          climatisation: newVehicle.climatisation,
        },
        dateAjout: Timestamp.fromDate(new Date()),
        proprietaireId: user?.id,
      }

      await addDoc(collection(db, "vehicules"), vehicleData)
      Alert.alert("Succès", "Véhicule ajouté avec succès !")
      setShowAddVehicleModal(false)
      resetNewVehicleForm()
      loadVehicles()
    } catch (error) {
      console.error("Erreur lors de l'ajout du véhicule:", error)
      Alert.alert("Erreur", "Impossible d'ajouter le véhicule")
    }
  }

  const resetNewVehicleForm = () => {
    setNewVehicle({
      nom: "",
      marque: "",
      type: "Berline",
      prix: "",
      description: "",
      image: "",
      carburant: "Essence",
      transmission: "Manuelle",
      places: "5",
      climatisation: true,
    })
  }

  const handleReservation = async () => {
    if (!selectedVehicle || !user) return

    if (!reservationData.dateDebut || !reservationData.dateFin) {
      Alert.alert("Erreur", "Veuillez sélectionner les dates de réservation")
      return
    }

    const dateDebut = new Date(reservationData.dateDebut + "T" + reservationData.heureDebut)
    const dateFin = new Date(reservationData.dateFin + "T" + reservationData.heureFin)

    if (dateDebut >= dateFin) {
      Alert.alert("Erreur", "La date de fin doit être après la date de début")
      return
    }

    if (dateDebut < new Date()) {
      Alert.alert("Erreur", "La date de début ne peut pas être dans le passé")
      return
    }

    const jours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24))
    const prixTotal = jours * selectedVehicle.prix

    Alert.alert(
      "Confirmer la réservation",
      `Véhicule: ${selectedVehicle.nom}\nDurée: ${jours} jour(s)\nPrix total: ${prixTotal.toLocaleString()} XAF\n\nConfirmer la réservation ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const reservationData = {
                userId: user.id,
                userNom: `${user.prenom} ${user.nom}`,
                userEmail: user.email,
                vehiculeId: selectedVehicle.id,
                vehiculeNom: selectedVehicle.nom,
                vehiculeImage: selectedVehicle.image,
                dateDebut: Timestamp.fromDate(dateDebut),
                dateFin: Timestamp.fromDate(dateFin),
                prixTotal,
                statut: "confirmee",
                dateReservation: Timestamp.fromDate(new Date()),
                paiementStatut: "en_attente",
                nombreJours: jours,
              }

              console.log("🚗 Création de la réservation:", reservationData)
              const docRef = await addDoc(collection(db, "reservations"), reservationData)
              console.log("✅ Réservation créée avec l'ID:", docRef.id)

              // Simuler le paiement
              await processPayment(prixTotal, selectedVehicle.nom, docRef.id)

              Alert.alert("Succès", "Réservation confirmée avec succès !")
              setShowReservationModal(false)
              resetReservationForm()
              router.push("/(tabs)/reservations")
            } catch (error) {
              console.error("❌ Erreur lors de la réservation:", error)
              Alert.alert("Erreur", "Impossible de confirmer la réservation")
            }
          },
        },
      ],
    )
  }

  const resetReservationForm = () => {
    setReservationData({
      dateDebut: "",
      dateFin: "",
      heureDebut: "09:00",
      heureFin: "18:00",
    })
  }

  const processPayment = async (montant: number, description: string, reservationId: string) => {
    try {
      const paiementData = {
        userId: user?.id,
        reservationId,
        montant,
        description: `Paiement pour ${description}`,
        statut: "reussi",
        methode: "carte_bancaire",
        datePaiement: Timestamp.fromDate(new Date()),
        transactionId: `TXN_${Date.now()}`,
        devise: "XAF",
      }

      await addDoc(collection(db, "paiements"), paiementData)
      console.log("💳 Paiement traité:", paiementData)
    } catch (error) {
      console.error("❌ Erreur lors du paiement:", error)
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} XAF`
  }

  // Données de démonstration améliorées
  const demoVehicles: Vehicle[] = [
    {
      id: "1",
      nom: "BMW X3 Premium",
      marque: "BMW",
      type: "SUV",
      prix: 85000,
      description: "SUV premium avec toutes les options de luxe, parfait pour les longs trajets",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&w=400&q=80",
      disponible: true,
      caracteristiques: {
        carburant: "Essence",
        transmission: "Automatique",
        places: 5,
        climatisation: true,
      },
      dateAjout: new Date(),
    },
    {
      id: "2",
      nom: "Audi A4 Executive",
      marque: "Audi",
      type: "Berline",
      prix: 65000,
      description: "Berline executive confortable avec finitions haut de gamme",
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&w=400&q=80",
      disponible: true,
      caracteristiques: {
        carburant: "Diesel",
        transmission: "Automatique",
        places: 5,
        climatisation: true,
      },
      dateAjout: new Date(),
    },
    {
      id: "3",
      nom: "Mercedes GLC Luxe",
      marque: "Mercedes",
      type: "SUV",
      prix: 95000,
      description: "SUV de luxe avec équipements premium et confort exceptionnel",
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&w=400&q=80",
      disponible: false,
      caracteristiques: {
        carburant: "Essence",
        transmission: "Automatique",
        places: 5,
        climatisation: true,
      },
      dateAjout: new Date(),
    },
    {
      id: "4",
      nom: "Peugeot 3008 GT",
      marque: "Peugeot",
      type: "SUV",
      prix: 45000,
      description: "SUV compact moderne avec design innovant",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&w=400&q=80",
      disponible: true,
      caracteristiques: {
        carburant: "Diesel",
        transmission: "Manuelle",
        places: 5,
        climatisation: true,
      },
      dateAjout: new Date(),
    },
    {
      id: "5",
      nom: "Toyota Corolla",
      marque: "Toyota",
      type: "Berline",
      prix: 35000,
      description: "Berline fiable et économique, idéale pour la ville",
      image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&w=400&q=80",
      disponible: true,
      caracteristiques: {
        carburant: "Essence",
        transmission: "Manuelle",
        places: 5,
        climatisation: true,
      },
      dateAjout: new Date(),
    },
    {
      id: "6",
      nom: "Ford Mustang GT",
      marque: "Ford",
      type: "Sportive",
      prix: 120000,
      description: "Voiture sportive emblématique avec performances exceptionnelles",
      image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&w=400&q=80",
      disponible: true,
      caracteristiques: {
        carburant: "Essence",
        transmission: "Automatique",
        places: 4,
        climatisation: true,
      },
      dateAjout: new Date(),
    },
  ]

  const renderVehicleCard = ({ item: vehicle }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => {
        setSelectedVehicle(vehicle)
        setShowReservationModal(true)
      }}
    >
      <View style={styles.vehicleImageContainer}>
        <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
        <View style={[styles.statusBadge, { backgroundColor: vehicle.disponible ? "#4ECDC4" : "#FF6B6B" }]}>
          <Text style={styles.statusText}>{vehicle.disponible ? "Disponible" : "Occupé"}</Text>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleName}>{vehicle.nom}</Text>
          <Text style={styles.vehiclePrice}>{formatPrice(vehicle.prix)}/jour</Text>
        </View>

        <Text style={styles.vehicleBrand}>
          {vehicle.marque} • {vehicle.type}
        </Text>

        <Text style={styles.vehicleDescription} numberOfLines={2}>
          {vehicle.description}
        </Text>

        <View style={styles.vehicleFeatures}>
          <View style={styles.feature}>
            <Ionicons name="people" size={16} color="#7F8C8D" />
            <Text style={styles.featureText}>{vehicle.caracteristiques.places} places</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="car" size={16} color="#7F8C8D" />
            <Text style={styles.featureText}>{vehicle.caracteristiques.transmission}</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="flash" size={16} color="#7F8C8D" />
            <Text style={styles.featureText}>{vehicle.caracteristiques.carburant}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.reserveButton, !vehicle.disponible && styles.disabledButton]}
          disabled={!vehicle.disponible}
          onPress={() => {
            setSelectedVehicle(vehicle)
            setShowReservationModal(true)
          }}
        >
          <Ionicons name={vehicle.disponible ? "calendar" : "close-circle"} size={16} color="white" />
          <Text style={styles.reserveButtonText}>{vehicle.disponible ? "Réserver" : "Indisponible"}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.loadingContainer}>
          <Ionicons name="car-sport" size={48} color="white" />
          <Text style={styles.loadingText}>Chargement des véhicules...</Text>
        </LinearGradient>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

      {/* Header amélioré */}
      <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Text style={styles.headerTitle}>Nos Véhicules</Text>
            <Text style={styles.headerSubtitle}>{filteredVehicles.length} véhicules disponibles</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddVehicleModal(true)}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche améliorée */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, marque ou type..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#7F8C8D"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filtres améliorés */}
      <View style={styles.filtersSection}>
        <Text style={styles.filterSectionTitle}>Filtrer par type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.activeFilterButton]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterSectionTitle}>Filtrer par prix (XAF/jour)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {priceFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, priceRange === filter && styles.activeFilterButton]}
              onPress={() => setPriceRange(filter)}
            >
              <Text style={[styles.filterText, priceRange === filter && styles.activeFilterText]}>
                {filter === "Tous" ? "Tous les prix" : `${filter.replace("-", " - ")} XAF`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des véhicules */}
      {filteredVehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyStateTitle}>Aucun véhicule trouvé</Text>
          <Text style={styles.emptyStateText}>
            Essayez de modifier vos critères de recherche ou ajoutez un nouveau véhicule
          </Text>
          <TouchableOpacity style={styles.addVehicleButton} onPress={() => setShowAddVehicleModal(true)}>
            <Text style={styles.addVehicleButtonText}>Ajouter un véhicule</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          renderItem={renderVehicleCard}
          keyExtractor={(item) => item.id}
          numColumns={isTablet ? 2 : 1}
          contentContainerStyle={styles.vehiclesList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Modal de réservation amélioré */}
      <Modal visible={showReservationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Réserver {selectedVehicle?.nom}</Text>
              <TouchableOpacity onPress={() => setShowReservationModal(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedVehicle && (
                <View style={styles.vehiclePreview}>
                  <Image source={{ uri: selectedVehicle.image }} style={styles.previewImage} />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>{selectedVehicle.nom}</Text>
                    <Text style={styles.previewPrice}>{formatPrice(selectedVehicle.prix)}/jour</Text>
                  </View>
                </View>
              )}

              <View style={styles.reservationForm}>
                <Text style={styles.inputLabel}>Date de début *</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD (ex: 2024-02-15)"
                  value={reservationData.dateDebut}
                  onChangeText={(text) => setReservationData((prev) => ({ ...prev, dateDebut: text }))}
                />

                <Text style={styles.inputLabel}>Heure de début</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="HH:MM (ex: 09:00)"
                  value={reservationData.heureDebut}
                  onChangeText={(text) => setReservationData((prev) => ({ ...prev, heureDebut: text }))}
                />

                <Text style={styles.inputLabel}>Date de fin *</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD (ex: 2024-02-18)"
                  value={reservationData.dateFin}
                  onChangeText={(text) => setReservationData((prev) => ({ ...prev, dateFin: text }))}
                />

                <Text style={styles.inputLabel}>Heure de fin</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="HH:MM (ex: 18:00)"
                  value={reservationData.heureFin}
                  onChangeText={(text) => setReservationData((prev) => ({ ...prev, heureFin: text }))}
                />

                {reservationData.dateDebut && reservationData.dateFin && (
                  <View style={styles.priceCalculation}>
                    <Text style={styles.calculationText}>
                      {`Durée estimée: ${Math.ceil(
                        (new Date(reservationData.dateFin).getTime() - new Date(reservationData.dateDebut).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )} jour(s)`}
                    </Text>
                    <Text style={styles.totalPrice}>
                      {`Total estimé: ${formatPrice(
                        Math.ceil(
                          (new Date(reservationData.dateFin).getTime() -
                            new Date(reservationData.dateDebut).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ) * (selectedVehicle?.prix || 0),
                      )}`}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.confirmButton} onPress={handleReservation}>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.confirmButtonText}>Confirmer la réservation</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal d'ajout de véhicule amélioré */}
      <Modal visible={showAddVehicleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un véhicule</Text>
              <TouchableOpacity onPress={() => setShowAddVehicleModal(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                {newVehicle.image ? (
                  <Image source={{ uri: newVehicle.image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={40} color="#7F8C8D" />
                    <Text style={styles.imagePlaceholderText}>Ajouter une photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Nom du véhicule *"
                value={newVehicle.nom}
                onChangeText={(text) => setNewVehicle((prev) => ({ ...prev, nom: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Marque *"
                value={newVehicle.marque}
                onChangeText={(text) => setNewVehicle((prev) => ({ ...prev, marque: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Prix par jour (XAF) *"
                value={newVehicle.prix}
                onChangeText={(text) => setNewVehicle((prev) => ({ ...prev, prix: text }))}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description du véhicule"
                value={newVehicle.description}
                onChangeText={(text) => setNewVehicle((prev) => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.confirmButton} onPress={addVehicle}>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.confirmButtonText}>Ajouter le véhicule</Text>
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
    paddingBottom: 25,
    paddingHorizontal: isTablet ? 30 : 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitleSection: {
    flex: 1,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 55,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchIcon: {
    marginRight: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
  },
  clearButton: {
    padding: 5,
  },
  filtersSection: {
    paddingVertical: 20,
    paddingHorizontal: isTablet ? 30 : 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F4",
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 10,
    marginTop: 10,
  },
  filtersContainer: {
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "#F8F9FA",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  activeFilterButton: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  filterText: {
    color: "#7F8C8D",
    fontWeight: "500",
    fontSize: 14,
  },
  activeFilterText: {
    color: "white",
    fontWeight: "600",
  },
  vehiclesList: {
    padding: isTablet ? 30 : 20,
    paddingBottom: 40,
  },
  vehicleCard: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 20,
    marginHorizontal: isTablet ? 10 : 0,
    flex: isTablet ? 0.48 : 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  vehicleImageContainer: {
    position: "relative",
  },
  vehicleImage: {
    width: "100%",
    height: isTablet ? 200 : 180,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  vehicleInfo: {
    padding: 20,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "bold",
    color: "#2C3E50",
    flex: 1,
    marginRight: 10,
  },
  vehiclePrice: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  vehicleBrand: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 10,
    fontWeight: "500",
  },
  vehicleDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 15,
    lineHeight: 20,
  },
  vehicleFeatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  reserveButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    backgroundColor: "#BDC3C7",
  },
  reserveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  addVehicleButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addVehicleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
    maxHeight: "85%",
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  modalBody: {
    padding: 25,
  },
  vehiclePreview: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },
  previewImage: {
    width: 80,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  previewInfo: {
    flex: 1,
    justifyContent: "center",
  },
  previewName: {
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
  reservationForm: {
    gap: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
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
  input: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
    marginBottom: 15,
    color: "#2C3E50",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  priceCalculation: {
    backgroundColor: "#E8F5E8",
    padding: 20,
    borderRadius: 15,
    marginVertical: 15,
  },
  calculationText: {
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 8,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4ECDC4",
  },
  confirmButton: {
    backgroundColor: "#FF6B6B",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  imagePickerButton: {
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: "#7F8C8D",
    fontSize: 16,
    fontWeight: "500",
  },
})
