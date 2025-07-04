"use client"
import { StyleSheet, Text, View } from "react-native"

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.txt}>Oups, page introuvable.</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  code: { fontSize: 48, fontWeight: "700" },
  txt: { fontSize: 16, color: "#666" },
})
