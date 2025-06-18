# Немного о самодельном кластере и тестировании

## 📋 Конфигурация кластера

- **Количество инстансов**: 5
- **Порты**: 3000, 3001, 3002, 3003, 3004 (хардкод, сорян 💩)

## 🚀 Запуск кластера

### Сперва

```bash
npm ci
```

```bash
cp .env.example .env
```

### Запуск бд

```bash
npm run docker:up
```

### Миграции

```bash
npm run migrate
```

### Node.js скрипт

```bash
npm run cluster
```

### API для мониторинга задач

```bash
# Список всех задач с информацией о выполнении
GET http://localhost:3000/scheduler/jobs

# История выполнения конкретной задачи
GET http://localhost:3000/scheduler/jobs/1/history

# Создание новой задачи
POST http://localhost:3000/scheduler/jobs
{
  "name": "Test Job",
  "handler": "cleanupData",
  "interval": "0 */5 * * * *",
  "is_active": true
}
```

### Тестирование отдельных инстансов

```bash
# Тест баланса пользователей
curl -X PATCH http://localhost:3000/users/balance \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "amount": -2}'
```
