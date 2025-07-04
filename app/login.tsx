"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { collection, getDocs, query, where } from "firebase/firestore"
import { useState } from "react"
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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
const isSmallScreen = width < 375

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  motDePasse: string
  telephone?: string
  dateCreation: any
  statut: "actif" | "inactif" | "suspendu"
}

export default function LoginPage() {
  const insets = useSafeAreaInsets()
  const [formData, setFormData] = useState({
    email: "",
    motDePasse: "",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = "Le mot de passe est requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const loginUser = async (email: string, password: string) => {
    try {
      // Rechercher l'utilisateur par email et mot de passe (sans hashage)
      const userQuery = query(
        collection(db, "utilisateurs"),
        where("email", "==", email.toLowerCase()),
        where("motDePasse", "==", password),
      )

      const userSnapshot = await getDocs(userQuery)

      if (userSnapshot.empty) {
        return { success: false, message: "Email ou mot de passe incorrect" }
      }

      const userDoc = userSnapshot.docs[0]
      const userData = userDoc.data()

      // Vérifier le statut du compte
      if (userData.statut !== "actif") {
        return {
          success: false,
          message:
            userData.statut === "suspendu"
              ? "Votre compte est suspendu. Contactez le support."
              : "Votre compte est inactif. Contactez le support.",
        }
      }

      const user: User = {
        id: userDoc.id,
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        motDePasse: userData.motDePasse,
        telephone: userData.telephone,
        dateCreation: userData.dateCreation,
        statut: userData.statut,
      }

      return { success: true, message: "Connexion réussie", user }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
      return { success: false, message: "Erreur lors de la connexion" }
    }
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await loginUser(formData.email.trim(), formData.motDePasse)

      if (result.success && result.user) {
        // Sauvegarder les informations utilisateur dans AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(result.user))
        await AsyncStorage.setItem("isLoggedIn", "true")
        await AsyncStorage.setItem("userId", result.user.id)

        console.log("✅ Connexion réussie, redirection vers le dashboard...")

        // Redirection immédiate vers le dashboard
        router.replace("/(tabs)")

        // Optionnel : afficher un message de succès après la redirection
        setTimeout(() => {
          Alert.alert("Connexion réussie", `Bienvenue ${result.user.prenom} ${result.user.nom} !`)
        }, 500)
      } else {
        Alert.alert("Erreur de connexion", result.message)
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur inattendue s'est produite")
      console.error("Erreur login:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    // Connexion avec un compte de démonstration
    setFormData({
      email: "demo@jtsk-drive.com",
      motDePasse: "demo123",
    })

    Alert.alert("Compte de démonstration", "Email: demo@jtsk-drive.com\nMot de passe: demo123", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se connecter",
        onPress: async () => {
          setLoading(true)
          try {
            const result = await loginUser("demo@jtsk-drive.com", "demo123")
            if (result.success && result.user) {
              await AsyncStorage.setItem("user", JSON.stringify(result.user))
              await AsyncStorage.setItem("isLoggedIn", "true")
              await AsyncStorage.setItem("userId", result.user.id)

              console.log("✅ Connexion démo réussie")
              router.replace("/(tabs)")
            } else {
              Alert.alert("Info", "Le compte de démonstration n'existe pas encore. Créez-le d'abord !")
            }
          } catch (error) {
            Alert.alert("Erreur", "Erreur lors de la connexion démo")
          } finally {
            setLoading(false)
          }
        },
      },
    ])
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
          <Ionicons name="log-in" size={isTablet ? 64 : 48} color="white" />
          <Text style={[styles.headerTitle, { fontSize: isTablet ? 36 : 32 }]}>Connexion</Text>
          <Text style={[styles.headerSubtitle, { fontSize: isTablet ? 18 : 16 }]}>
            Accédez à votre compte JTSK-Drive
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.formContainer}>
        <View style={[styles.form, { paddingHorizontal: isTablet ? 50 : 25 }]}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: isTablet ? 18 : 16 }]}>Email</Text>
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

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: isTablet ? 18 : 16 }]}>Mot de passe</Text>
            <View
              style={[styles.inputContainer, errors.motDePasse && styles.inputError, { height: isTablet ? 65 : 55 }]}
            >
              <Ionicons name="lock-closed" size={isTablet ? 24 : 20} color="#7F8C8D" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontSize: isTablet ? 18 : 16 }]}
                placeholder="Votre mot de passe"
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

          {/* Mot de passe oublié */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => Alert.alert("Mot de passe oublié", "Contactez le support à support@jtsk-drive.com")}
          >
            <Text style={[styles.forgotPasswordText, { fontSize: isTablet ? 16 : 14 }]}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Bouton de connexion */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
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
                <Text style={[styles.buttonText, { fontSize: isTablet ? 20 : 18 }]}>Connexion en cours...</Text>
              ) : (
                <>
                  <Text style={[styles.buttonText, { fontSize: isTablet ? 20 : 18 }]}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={isTablet ? 24 : 20} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Lien vers inscription */}
          <View style={styles.signupLink}>
            <Text style={[styles.signupLinkText, { fontSize: isTablet ? 18 : 16 }]}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={[styles.signupLinkButton, { fontSize: isTablet ? 18 : 16 }]}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          {/* Séparateur */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={[styles.separatorText, { fontSize: isTablet ? 16 : 14 }]}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Connexion rapide demo */}
          <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin}>
            <Ionicons name="flash" size={isTablet ? 24 : 20} color="#4ECDC4" />
            <Text style={[styles.demoButtonText, { fontSize: isTablet ? 18 : 16 }]}>Compte de démonstration</Text>
          </TouchableOpacity>

          {/* Informations de sécurité */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={isTablet ? 20 : 16} color="#96CEB4" />
            <Text style={[styles.securityText, { fontSize: isTablet ? 14 : 12 }]}>
              Vos données sont sécurisées et chiffrées
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingBottom: isTablet ? 50 : 40,
    paddingHorizontal: isTablet ? 40 : 20,
  },
  backButton: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isTablet ? 40 : 30,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
    color: "white",
    marginTop: 15,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    maxWidth: isTablet ? 400 : "100%",
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
  },
  form: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: isTablet ? 50 : 40,
    paddingBottom: 40,
    minHeight: "100%",
  },
  inputGroup: {
    marginBottom: isTablet ? 30 : 25,
  },
  label: {
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: isTablet ? 12 : 10,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: isTablet ? 40 : 30,
  },
  forgotPasswordText: {
    color: "#FF6B6B",
    fontWeight: "500",
  },
  loginButton: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: isTablet ? 40 : 30,
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
  signupLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isTablet ? 40 : 30,
  },
  signupLinkText: {
    color: "#7F8C8D",
  },
  signupLinkButton: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isTablet ? 30 : 25,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E9ECEF",
  },
  separatorText: {
    marginHorizontal: 15,
    color: "#7F8C8D",
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDFC",
    paddingVertical: isTablet ? 18 : 15,
    paddingHorizontal: isTablet ? 25 : 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#4ECDC4",
    gap: 10,
    marginBottom: isTablet ? 30 : 25,
  },
  demoButtonText: {
    color: "#4ECDC4",
    fontWeight: "600",
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F4",
  },
  securityText: {
    color: "#96CEB4",
    fontWeight: "500",
  },
})
