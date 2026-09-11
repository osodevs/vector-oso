FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_KOFI_URL
ARG VITE_LEGAL_NAME
ARG VITE_LEGAL_ADDRESS
ARG VITE_LEGAL_EMAIL
ENV VITE_KOFI_URL=$VITE_KOFI_URL
ENV VITE_LEGAL_NAME=$VITE_LEGAL_NAME
ENV VITE_LEGAL_ADDRESS=$VITE_LEGAL_ADDRESS
ENV VITE_LEGAL_EMAIL=$VITE_LEGAL_EMAIL

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
