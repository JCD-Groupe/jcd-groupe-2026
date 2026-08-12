FROM node:lts-alpine
WORKDIR /app

# Copie et installation
COPY package*.json ./
RUN npm install

# Copie tout le projet (.env inclus)
COPY . .

# Build statique (SSG)
RUN npm run build

# Installation d'un petit serveur pour servir le dossier dist
RUN npm install -g serve

EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
