FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:22-slim
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=build /app .
USER app
EXPOSE 10000
CMD ["node", "server/index.js"]
