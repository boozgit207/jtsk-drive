# Utilise une image Node officielle
FROM node:18

# Installer expo-cli et eas-cli
RUN npm install -g expo-cli eas-cli

# Créer le dossier de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de ton projet dans le conteneur
COPY . .

# Installer les dépendances
RUN npm install

# Lancer un build APK à la main OU lancer expo si tu veux un shell
CMD ["eas", "build", "-p", "android", "--profile", "production"]
