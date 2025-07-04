"use client"

import { collection, getDocs } from "firebase/firestore"
import { db } from "../services/firebase"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  age: number
  interests: string[]
  location: {
    latitude: number
    longitude: number
    city: string
  }
  preferences: {
    ageMin: number
    ageMax: number
    maxDistance: number
    gender: string
  }
}

interface MatchResult {
  user: User
  score: number
  commonInterests: string[]
  distance: number
}

export class MatchingSystem {
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  static calculateCompatibilityScore(user1: User, user2: User): number {
    let score = 0

    // Age compatibility (30% weight)
    const ageCompatible = user2.age >= user1.preferences.ageMin && user2.age <= user1.preferences.ageMax
    if (ageCompatible) score += 30

    // Common interests (40% weight)
    const commonInterests = user1.interests.filter((interest) => user2.interests.includes(interest))
    const interestScore = (commonInterests.length / Math.max(user1.interests.length, 1)) * 40
    score += interestScore

    // Distance (20% weight)
    const distance = this.calculateDistance(
      user1.location.latitude,
      user1.location.longitude,
      user2.location.latitude,
      user2.location.longitude,
    )
    const distanceScore = distance <= user1.preferences.maxDistance ? 20 : 0
    score += distanceScore

    // Activity level (10% weight)
    // This could be based on last login, profile completeness, etc.
    score += 10

    return Math.round(score)
  }

  static async findMatches(currentUser: User): Promise<MatchResult[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const potentialMatches: MatchResult[] = []

      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as User
        if (userData.email !== currentUser.email) {
          const score = this.calculateCompatibilityScore(currentUser, userData)
          const commonInterests = currentUser.interests.filter((interest) => userData.interests?.includes(interest))
          const distance = this.calculateDistance(
            currentUser.location.latitude,
            currentUser.location.longitude,
            userData.location?.latitude || 0,
            userData.location?.longitude || 0,
          )

          if (score >= 50) {
            // Minimum compatibility threshold
            potentialMatches.push({
              user: { id: doc.id, ...userData },
              score,
              commonInterests,
              distance,
            })
          }
        }
      })

      // Sort by compatibility score
      return potentialMatches.sort((a, b) => b.score - a.score)
    } catch (error) {
      console.error("Error finding matches:", error)
      return []
    }
  }

  static async checkMutualLike(user1Email: string, user2Email: string): Promise<boolean> {
    try {
      const interactionsSnapshot = await getDocs(collection(db, "interactions"))
      let user1LikesUser2 = false
      let user2LikesUser1 = false

      interactionsSnapshot.forEach((doc) => {
        const interaction = doc.data()
        if (
          interaction.user === user1Email &&
          interaction.target === user2Email &&
          (interaction.type === "like" || interaction.type === "super_like")
        ) {
          user1LikesUser2 = true
        }
        if (
          interaction.user === user2Email &&
          interaction.target === user1Email &&
          (interaction.type === "like" || interaction.type === "super_like")
        ) {
          user2LikesUser1 = true
        }
      })

      return user1LikesUser2 && user2LikesUser1
    } catch (error) {
      console.error("Error checking mutual like:", error)
      return false
    }
  }
}
