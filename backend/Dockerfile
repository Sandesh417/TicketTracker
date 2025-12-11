FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install -g nodemon && npm install

COPY . .

RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 3001

CMD ["nodemon", "--legacy-watch", "server.js"]
