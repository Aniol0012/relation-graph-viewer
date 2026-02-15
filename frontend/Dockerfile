FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

RUN addgroup appuser && \
    adduser -D -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

CMD ["serve", "-s", "build", "-l", "3000"]

