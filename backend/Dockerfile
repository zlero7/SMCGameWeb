FROM node:20-alpine

RUN apk add --no-cache openssl mysql-client

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 4000

CMD ["npm", "run", "dev"]
