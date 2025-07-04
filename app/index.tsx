import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")
const isTablet = width >= 768
const isSmallScreen = width < 375

export default function HomePage() {
  const insets = useSafeAreaInsets()

  const features = [
    {
      icon: "car-sport",
      title: "Véhicules Premium",
      description: "Large sélection de véhicules de luxe et économiques",
      color: "#FF6B6B",
    },
    {
      icon: "calendar",
      title: "Réservation Facile",
      description: "Réservez en quelques clics, modifiez à tout moment",
      color: "#4ECDC4",
    },
    {
      icon: "shield-checkmark",
      title: "Sécurisé",
      description: "Paiements sécurisés et assurance incluse",
      color: "#45B7D1",
    },
    {
      icon: "time",
      title: "Disponible 24/7",
      description: "Service client disponible à tout moment",
      color: "#96CEB4",
    },
  ]

  const stats = [
    { number: "500+", label: "Véhicules" },
    { number: "10K+", label: "Clients Satisfaits" },
    { number: "50+", label: "Villes" },
    { number: "24/7", label: "Support" },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero Section */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        }}
        style={[styles.heroSection, { minHeight: height * (isTablet ? 0.7 : 0.85) }]}
        resizeMode="cover"
      >
        <LinearGradient colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]} style={styles.heroOverlay}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.logoContainer}>
              <Ionicons name="car-sport" size={isTablet ? 40 : 32} color="#FF6B6B" />
              <Text style={[styles.logoText, { fontSize: isTablet ? 28 : 24 }]}>JTSK-Drive</Text>
            </View>
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/login")}>
              <Text style={[styles.loginButtonText, { fontSize: isTablet ? 18 : 16 }]}>Connexion</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <Text
              style={[
                styles.heroTitle,
                {
                  fontSize: isTablet ? 64 : isSmallScreen ? 40 : 48,
                  lineHeight: isTablet ? 72 : isSmallScreen ? 48 : 56,
                },
              ]}
            >
              Votre Véhicule{"\n"}
              <Text style={styles.heroTitleAccent}>Parfait</Text>
              {"\n"}
              Vous Attend
            </Text>
            <Text
              style={[
                styles.heroSubtitle,
                {
                  fontSize: isTablet ? 20 : 18,
                  maxWidth: isTablet ? 600 : "100%",
                  lineHeight: isTablet ? 28 : 26,
                },
              ]}
            >
              Découvrez notre collection exclusive de véhicules premium. Réservation instantanée, prix transparents.
            </Text>

            <View
              style={[
                styles.heroButtons,
                {
                  flexDirection: isTablet ? "row" : width < 350 ? "column" : "row",
                  gap: isTablet ? 20 : 15,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    paddingHorizontal: isTablet ? 40 : 30,
                    paddingVertical: isTablet ? 18 : 15,
                  },
                ]}
                onPress={() => router.push("/signup")}
              >
                <Text style={[styles.primaryButtonText, { fontSize: isTablet ? 18 : 16 }]}>Commencer</Text>
                <Ionicons name="arrow-forward" size={isTablet ? 24 : 20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    paddingHorizontal: isTablet ? 35 : 25,
                    paddingVertical: isTablet ? 18 : 15,
                  },
                ]}
                onPress={() => router.push("/(tabs)/vehicles")}
              >
                <Ionicons name="car" size={isTablet ? 24 : 20} color="#FF6B6B" />
                <Text style={[styles.secondaryButtonText, { fontSize: isTablet ? 18 : 16 }]}>Voir Véhicules</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Stats Section */}
      <View style={[styles.statsSection, { paddingVertical: isTablet ? 60 : 40 }]}>
        <View
          style={[
            styles.statsContainer,
            {
              flexDirection: isTablet ? "row" : width < 350 ? "column" : "row",
              gap: isTablet ? 0 : width < 350 ? 20 : 0,
            },
          ]}
        >
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statItem,
                {
                  width: isTablet ? "auto" : width < 350 ? "100%" : "auto",
                },
              ]}
            >
              <Text style={[styles.statNumber, { fontSize: isTablet ? 40 : 32 }]}>{stat.number}</Text>
              <Text style={[styles.statLabel, { fontSize: isTablet ? 16 : 14 }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Features Section */}
      <View
        style={[
          styles.featuresSection,
          {
            paddingVertical: isTablet ? 80 : 60,
            paddingHorizontal: isTablet ? 40 : 20,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              fontSize: isTablet ? 40 : isSmallScreen ? 28 : 32,
              maxWidth: isTablet ? 800 : "100%",
            },
          ]}
        >
          Pourquoi Choisir JTSK-Drive ?
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            {
              fontSize: isTablet ? 18 : 16,
              maxWidth: isTablet ? 600 : "100%",
            },
          ]}
        >
          Une expérience de location et d'achat révolutionnaire
        </Text>

        <View
          style={[
            styles.featuresGrid,
            {
              flexDirection: isTablet ? "row" : "row",
              flexWrap: "wrap",
              justifyContent: isTablet ? "space-between" : "space-between",
              gap: isTablet ? 30 : 20,
            },
          ]}
        >
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                {
                  width: isTablet ? (width - 140) / 4 : (width - 60) / 2,
                  padding: isTablet ? 35 : 25,
                  minHeight: isTablet ? 220 : 180,
                },
              ]}
            >
              <View
                style={[
                  styles.featureIcon,
                  {
                    width: isTablet ? 80 : 60,
                    height: isTablet ? 80 : 60,
                    borderRadius: isTablet ? 40 : 30,
                    backgroundColor: feature.color,
                  },
                ]}
              >
                <Ionicons name={feature.icon as any} size={isTablet ? 32 : 24} color="white" />
              </View>
              <Text
                style={[
                  styles.featureTitle,
                  {
                    fontSize: isTablet ? 20 : 18,
                    marginBottom: isTablet ? 15 : 10,
                  },
                ]}
              >
                {feature.title}
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  {
                    fontSize: isTablet ? 16 : 14,
                    lineHeight: isTablet ? 22 : 20,
                  },
                ]}
              >
                {feature.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={["#FF6B6B", "#FF8E8E"]}
        style={[
          styles.ctaSection,
          {
            paddingVertical: isTablet ? 70 : 50,
            paddingHorizontal: isTablet ? 40 : 20,
          },
        ]}
      >
        <Text
          style={[
            styles.ctaTitle,
            {
              fontSize: isTablet ? 36 : 28,
              maxWidth: isTablet ? 600 : "100%",
            },
          ]}
        >
          Prêt à Commencer ?
        </Text>
        <Text
          style={[
            styles.ctaSubtitle,
            {
              fontSize: isTablet ? 18 : 16,
              maxWidth: isTablet ? 500 : "100%",
            },
          ]}
        >
          Rejoignez des milliers de clients satisfaits
        </Text>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            {
              paddingHorizontal: isTablet ? 40 : 30,
              paddingVertical: isTablet ? 18 : 15,
            },
          ]}
          onPress={() => router.push("/signup")}
        >
          <Text style={[styles.ctaButtonText, { fontSize: isTablet ? 18 : 16 }]}>Créer un Compte</Text>
          <Ionicons name="person-add" size={isTablet ? 24 : 20} color="#FF6B6B" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Footer */}
      <View style={[styles.footer, { paddingVertical: isTablet ? 40 : 30 }]}>
        <View style={[styles.footerContent, { paddingHorizontal: isTablet ? 40 : 20 }]}>
          <View style={styles.footerLogo}>
            <Ionicons name="car-sport" size={isTablet ? 28 : 24} color="#FF6B6B" />
            <Text style={[styles.footerLogoText, { fontSize: isTablet ? 24 : 20 }]}>JTSK-Drive</Text>
          </View>
          <Text style={[styles.footerText, { fontSize: isTablet ? 16 : 14 }]}>
            © 2024 JTSK-Drive. Tous droits réservés.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  heroSection: {
    width: "100%",
  },
  heroOverlay: {
    flex: 1,
    paddingHorizontal: isTablet ? 40 : 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  loginButton: {
    paddingHorizontal: isTablet ? 25 : 20,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "white",
  },
  loginButtonText: {
    color: "white",
    fontWeight: "600",
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: isTablet ? 40 : 20,
  },
  heroTitle: {
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: isTablet ? 30 : 20,
  },
  heroTitleAccent: {
    color: "#FF6B6B",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: isTablet ? 50 : 40,
  },
  heroButtons: {
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 5,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  secondaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  statsSection: {
    backgroundColor: "#F8F9FA",
  },
  statsContainer: {
    justifyContent: "space-around",
    paddingHorizontal: isTablet ? 40 : 20,
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  statLabel: {
    color: "#7F8C8D",
    fontWeight: "500",
  },
  featuresSection: {
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 10,
  },
  sectionSubtitle: {
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: isTablet ? 50 : 40,
  },
  featuresGrid: {
    width: "100%",
  },
  featureCard: {
    backgroundColor: "white",
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featureIcon: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  featureTitle: {
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
  },
  featureDescription: {
    color: "#7F8C8D",
    textAlign: "center",
  },
  ctaSection: {
    alignItems: "center",
  },
  ctaTitle: {
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },
  ctaSubtitle: {
    color: "rgba(255,255,255,0.9)",
    marginBottom: 30,
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "white",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  ctaButtonText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  footer: {
    backgroundColor: "#2C3E50",
  },
  footerContent: {
    alignItems: "center",
  },
  footerLogo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  footerLogoText: {
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  footerText: {
    color: "#BDC3C7",
  },
})
