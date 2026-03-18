FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY .sequelizerc ./
RUN npm install

COPY . .

RUN chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

CMD ["/app/docker-entrypoint.sh"]
