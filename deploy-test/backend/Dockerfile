FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "index.js"]
