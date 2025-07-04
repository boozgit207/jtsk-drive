"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { addDoc, collection, getDocs, query, Timestamp, where } from "firebase/firestore"
import { useState } from "react"
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { db } from "../services/firebase"

const { width } = Dimensions.get("window")
const isTablet = width >= 768

// Interface pour définir la structure des données utilisateur
interface UserData {
  nom: string
  prenom: string
  email: string
  motDePasse: string
  telephone?: string
  dateCreation: Date
  statut: "actif" | "inactif" | "suspendu"
}

export default function SignupPage() {
  const insets = useSafeAreaInsets()
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    confirmPassword: "",
    telephone: "",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis"
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères"
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est requis"
    } else if (formData.prenom.trim().length < 2) {
      newErrors.prenom = "Le prénom doit contenir au moins 2 caractères"
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = "Le mot de passe est requis"
    } else if (formData.motDePasse.length < 6) {
      newErrors.motDePasse = "Le mot de passe doit contenir au moins 6 caractères"
    }

    if (formData.motDePasse !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
    }

    if (formData.telephone && !/^[0-9+\-\s()]+$/.test(formData.telephone)) {
      newErrors.telephone = "Format de téléphone invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 🔥 FONCTION PRINCIPALE DE CRÉATION D'UTILISATEUR DANS FIRESTORE
  const createUser = async (userData: Omit<UserData, "dateCreation" | "statut">) => {
    try {
      console.log("🔍 Vérification de l'email existant...")

      // 1. Vérifier si l'email existe déjà dans la collection "utilisateurs"
      const emailQuery = query(
        collection(db, "utilisateurs"), // 👈 Collection "utilisateurs"
        where("email", "==", userData.email.toLowerCase()),
      )
      const emailSnapshot = await getDocs(emailQuery)

      if (!emailSnapshot.empty) {
        console.log("❌ Email déjà utilisé")
        return { success: false, message: "Cet email est déjà utilisé" }
      }

      console.log("✅ Email disponible, création de l'utilisateur...")

      // 2. Préparer les données utilisateur pour Firestore
      const newUser = {
        nom: userData.nom.trim(),
        prenom: userData.prenom.trim(),
        email: userData.email.toLowerCase(), // Email en minuscules
        motDePasse: userData.motDePasse, // Pas de hashage comme demandé
        telephone: userData.telephone || "", // Téléphone optionnel
        dateCreation: Timestamp.fromDate(new Date()), // Timestamp Firestore
        statut: "actif", // Statut par défaut
        // Champs additionnels pour l'app
        dateNaissance: null,
        adresse: "",
        permisConduire: "",
        pointsFidelite: 0,
        totalReservations: 0,
        totalDepenses: 0,
      }

      console.log("📝 Données à sauvegarder:", {
        ...newUser,
        motDePasse: "***masqué***", // Pour la sécurité dans les logs
      })

      // 3. Ajouter l'utilisateur à la collection "utilisateurs"
      const docRef = await addDoc(collection(db, "utilisateurs"), newUser)

      console.log("🎉 Utilisateur créé avec succès! ID:", docRef.id)

      return {
        success: true,
        message: "Compte créé avec succès",
        userId: docRef.id,
        userData: { ...newUser, id: docRef.id },
      }
    } catch (error) {
      console.error("💥 Erreur lors de la création de l'utilisateur:", error)
      return {
        success: false,
        message: "Erreur lors de la création du compte. Vérifiez votre connexion.",
      }
    }
  }

  const handleSignup = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      console.log("🚀 Début de l'inscription...")

      const result = await createUser({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        motDePasse: formData.motDePasse,
        telephone: formData.telephone,
      })

      if (result.success) {
        console.log("✅ Inscription réussie!")

        Alert.alert(
          "🎉 Inscription réussie!",
          `Bienvenue ${formData.prenom} ${formData.nom} !\n\nVotre compte a été créé avec succès.\nID utilisateur: ${result.userId}`,
          [
            {
              text: "Se connecter maintenant",
              onPress: () => {
                // Pré-remplir les champs de connexion
                router.push({
                  pathname: "/login",
                  params: { email: formData.email },
                })
              },
            },
          ],
        )
      } else {
        console.log("❌ Échec de l'inscription:", result.message)
        Alert.alert("Erreur d'inscription", result.message)
      }
    } catch (error) {
      console.error("💥 Erreur inattendue:", error)
      Alert.alert("Erreur", "Une erreur inattendue s'est produite")
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

      <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Ionicons name="person-add" size={isTablet ? 64 : 48} color="white" />
          <Text style={[styles.headerTitle, { fontSize: isTablet ? 36 : 28 }]}>Créer un Compte</Text>
          <Text style={[styles.headerSubtitle, { fontSize: isTablet ? 18 : 16 }]}>
            Rejoignez JTSK-Drive aujourd'hui
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={[styles.form, { paddingHorizontal: isTablet ? 40 : 25 }]}>
          {/* Nom et Prénom */}
          <View style={[styles.rowContainer, { flexDirection: isTablet ? "row" : "column" }]}>
            <View style={[styles.inputGroup, { flex: isTablet ? 1 : undefined, marginRight: isTablet ? 15 : 0 }]}>
              <Text style={[styles.label, { fontSize: isTablet ? 18 : 16 }]}>Nom *</Text>
              <View style={[styles.inputContainer, errors.nom && styles.inputError, { height: isTablet ? 65 : 55 }]}>
                <Ionicons name="person" size={isTablet ? 24 : 20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                  placeholder="Votre nom"
                  value={formData.nom}
                  onChangeText={(text) => updateFormData("nom", text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.nom && <Text style={[styles.errorText, { fontSize: isTablet ? 16 : 14 }]}>{errors.nom}</Text>}
            </View>

            <View style={[styles.inputGroup, { flex: isTablet ? 1 : undefined, marginLeft: isTablet ? 15 : 0 }]}>
              <Text style={[styles.label, { fontSize: isTablet ? 18 : 16 }]}>Prénom *</Text>
              <View style={[styles.inputContainer, errors.prenom && styles.inputError, { height: isTablet ? 65 : 55 }]}>
                <Ionicons name="person" size={isTablet ? 24 : 20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                  placeholder="Votre prénom"
                  value={formData.prenom}
                  onChangeText={(text) => updateFormData("prenom", text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.prenom && (
                <Text style={[styles.errorText, { fontSize: isTablet ? 16 : 14 }]}>{errors.prenom}</Text>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: isTablet ? 18 : 16 }]}>Email *</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError, { height: isTablet ? 65 : 55 }]}>
              <Ionicons name="mail" size={isTablet ? 24 : 20} color="#7F8C8D" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                placeholder="votre@email.com"
                value={formData.email}
                onChangeText={(text) => updateFormData("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={[styles.errorText, { fontSize: isTablet ? 16 : 14 }]}>{errors.email}</Text>}
          </View>

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: isTablet ? 18 : 16 }]}>Téléphone</Text>
            <View
              style={[styles.inputContainer, errors.telephone && styles.inputError, { height: isTablet ? 65 : 55 }]}
            >
              <Ionicons name="call" size={isTablet ? 24 : 20} color="#7F8C8D" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                placeholder="+33 6 12 34 56 78"
                value={formData.telephone}
                onChangeText={(text) => updateFormData("telephone", text)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.telephone && (
              <Text style={[styles.errorText, { fontSize: isTablet ? 16 : 14 }]}>{errors.telephone}</Text>
            )}
          </View>

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: isTablet ? 18 : 16 }]}>Mot de passe *</Text>
            <View
              style={[styles.inputContainer, errors.motDePasse && styles.inputError, { height: isTablet ? 65 : 55 }]}
            >
              <Ionicons name="lock-closed" size={isTablet ? 24 : 20} color="#7F8C8D" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                placeholder="Minimum 6 caractères"
                value={formData.motDePasse}
                onChangeText={(text) => updateFormData("motDePasse", text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={isTablet ? 24 : 20} color="#7F8C8D" />
              </TouchableOpacity>
            </View>
            {errors.motDePasse && (
              <Text style={[styles.errorText, { fontSize: isTablet ? 16 : 14 }]}>{errors.motDePasse}</Text>
            )}
          </View>

          {/* Confirmer mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: isTablet ? 18 : 16 }]}>Confirmer le mot de passe *</Text>
            <View
              style={[
                styles.inputContainer,
                errors.confirmPassword && styles.inputError,
                { height: isTablet ? 65 : 55 },
              ]}
            >
              <Ionicons name="lock-closed" size={isTablet ? 24 : 20} color="#7F8C8D" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                placeholder="Répétez votre mot de passe"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData("confirmPassword", text)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={isTablet ? 24 : 20} color="#7F8C8D" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={[styles.errorText, { fontSize: isTablet ? 16 : 14 }]}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Bouton d'inscription */}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FF6B6B", "#FF8E8E"]}
              style={[
                styles.buttonGradient,
                {
                  paddingVertical: isTablet ? 22 : 18,
                  paddingHorizontal: isTablet ? 40 : 30,
                },
              ]}
            >
              {loading ? (
                <Text style={[styles.buttonText, { fontSize: isTablet ? 20 : 18 }]}>Création en cours...</Text>
              ) : (
                <>
                  <Text style={[styles.buttonText, { fontSize: isTablet ? 20 : 18 }]}>Créer mon compte</Text>
                  <Ionicons name="arrow-forward" size={isTablet ? 24 : 20} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Lien vers connexion */}
          <View style={styles.loginLink}>
            <Text style={[styles.loginLinkText, { fontSize: isTablet ? 18 : 16 }]}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={[styles.loginLinkButton, { fontSize: isTablet ? 18 : 16 }]}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingBottom: isTablet ? 40 : 30,
    paddingHorizontal: isTablet ? 40 : 20,
  },
  backButton: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isTablet ? 30 : 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
    color: "white",
    marginTop: 15,
    marginBottom: 5,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
  },
  form: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: isTablet ? 40 : 30,
    minHeight: "100%",
  },
  rowContainer: {
    gap: isTablet ? 0 : 20,
  },
  inputGroup: {
    marginBottom: isTablet ? 25 : 20,
  },
  label: {
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: isTablet ? 12 : 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    paddingHorizontal: isTablet ? 20 : 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  inputError: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  inputIcon: {
    marginRight: isTablet ? 15 : 12,
  },
  input: {
    flex: 1,
    color: "#2C3E50",
  },
  eyeIcon: {
    padding: 5,
  },
  errorText: {
    color: "#FF6B6B",
    marginTop: 5,
    marginLeft: 5,
  },
  signupButton: {
    marginTop: isTablet ? 40 : 30,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: isTablet ? 40 : 30,
  },
  loginLinkText: {
    color: "#7F8C8D",
  },
  loginLinkButton: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
})
