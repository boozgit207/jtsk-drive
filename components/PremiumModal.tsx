import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface PremiumModalProps {
  visible: boolean
  onClose: () => void
  onSubscribe: (plan: string) => void
}

const PREMIUM_FEATURES = [
  {
    icon: "heart" as keyof typeof Ionicons.glyphMap,
    title: "Likes illimités",
    description: "Likez autant de profils que vous voulez",
  },
  {
    icon: "eye" as keyof typeof Ionicons.glyphMap,
    title: "Voir qui vous a liké",
    description: "Découvrez qui s'intéresse à vous",
  },
  {
    icon: "flash" as keyof typeof Ionicons.glyphMap,
    title: "Super Likes",
    description: "5 Super Likes par jour pour vous démarquer",
  },
  {
    icon: "location" as keyof typeof Ionicons.glyphMap,
    title: "Passeport",
    description: "Changez votre localisation pour rencontrer partout",
  },
  {
    icon: "refresh" as keyof typeof Ionicons.glyphMap,
    title: "Rewind",
    description: "Annulez votre dernier swipe",
  },
  {
    icon: "star" as keyof typeof Ionicons.glyphMap,
    title: "Boost mensuel",
    description: "Soyez vu 10x plus pendant 30 minutes",
  },
]

const PLANS = [
  {
    id: "monthly",
    name: "Mensuel",
    price: "9,99€",
    period: "/mois",
    popular: false,
  },
  {
    id: "quarterly",
    name: "Trimestriel",
    price: "19,99€",
    period: "/3 mois",
    popular: true,
    savings: "Économisez 33%",
  },
  {
    id: "yearly",
    name: "Annuel",
    price: "59,99€",
    period: "/an",
    popular: false,
    savings: "Économisez 50%",
  },
]

export default function PremiumModal({ visible, onClose, onSubscribe }: PremiumModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crushio Premium</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.heroSection}>
            <Ionicons name="star" size={40} color="#FFFFFF" />
            <Text style={styles.heroTitle}>Débloquez votre potentiel</Text>
            <Text style={styles.heroSubtitle}>Accédez à toutes les fonctionnalités premium</Text>
          </LinearGradient>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Fonctionnalités Premium</Text>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={24} color="#FF6B6B" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>Choisissez votre plan</Text>
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, plan.popular && styles.popularPlan]}
                onPress={() => onSubscribe(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.savings && <Text style={styles.planSavings}>{plan.savings}</Text>}
                </View>

                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              L'abonnement se renouvelle automatiquement. Vous pouvez annuler à tout moment dans les paramètres de votre
              compte.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 15,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 10,
    textAlign: "center",
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  plansSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularPlan: {
    borderColor: "#FF6B6B",
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  planSavings: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planPricing: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  planPeriod: {
    fontSize: 16,
    color: "#666",
    marginLeft: 5,
  },
  termsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  termsText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
})
