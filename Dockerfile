# 1. Используем стабильную ноду
FROM node:20-alpine

# 2. Создаем рабочую директорию
WORKDIR /usr/src/app

# 3. Копируем файлы зависимостей
COPY package*.json ./

# 4. Устанавливаем зависимости
RUN yarn install

# 5. Копируем весь исходный код
COPY . .

# 7. Открываем порт
EXPOSE 3000

# 8. Запускаем в режиме разработки (или production)
CMD ["yarn", "run", "start:dev"]