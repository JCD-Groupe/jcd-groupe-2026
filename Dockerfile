FROM node:lts-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci

# Copie du reste du code source
COPY . .

EXPOSE 4321

# Démarrage d'un serveur statique ultra-léger pour servir le dossier dist
CMD ["npx", "serve", "dist", "-l", "4321"]
