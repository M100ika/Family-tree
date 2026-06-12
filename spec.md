# Спецификация проекта: Digital Lineage (Цифровое наследие)

## 1. Обзор проекта
**Digital Lineage** — это кроссплатформенная веб-система (Mobile/Desktop) для создания, визуализации и ведения интерактивного генеалогического древа. Система поддерживает многопользовательский режим, позволяя изолированно вести свои деревья, делиться доступом, использовать ИИ для автоматического поиска родственников в глобальной базе и безопасно объединять пересекающиеся ветви при взаимном согласии.

### Технологический стек:
- **Frontend:** React, TypeScript, Vite, Tailwind CSS (Mobile-First адаптивность), Framer Motion / Motion.
- **Backend:** Node.js + Express (для локальной разработки), Vercel Serverless Functions (`/api/*`) для продакшена.
- **Интеграции:** Supabase (PostgreSQL, Auth, RLS), Google AI SDK (Gemini API) для ИИ-функций.

---

## 2. Архитектура базы данных (Supabase)

### Перечисления (Enums)
- `permission_type`: `('view', 'edit')`
- `request_status`: `('pending', 'accepted', 'rejected')`
- `user_role`: `('user', 'admin')`

### Таблицы и связи

#### 1. profiles (Профили и Роли)
- `id`: `uuid` (PRIMARY KEY, references `auth.users.id` ON DELETE CASCADE)
- `updated_at`: `timestamp with time zone`
- `full_name`: `text`
- `role`: `user_role` (default: 'user') — флаг глобального администратора

#### 2. people (Члены семьи)
- `id`: `uuid` (PRIMARY KEY, default: `gen_random_uuid()`)
- `user_id`: `uuid` (NOT NULL, references `profiles.id` ON DELETE CASCADE) — владелец ветки
- `first_name`: `text` (NOT NULL)
- `last_name`: `text`
- `maiden_name`: `text` (девичья фамилия)
- `birth_date`: `date`
- `death_date`: `date` (nullable)
- `birth_place`: `text`
- `biography`: `text`
- `avatar_url`: `text`
- `father_id`: `uuid` (references `people.id` ON DELETE SET NULL)
- `mother_id`: `uuid` (references `people.id` ON DELETE SET NULL)
- `spouse_id`: `uuid` (references `people.id` ON DELETE SET NULL)
- `created_at`: `timestamp with time zone` (default: `now()`)

#### 3. tree_permissions (Общий доступ к деревьям)
- `id`: `uuid` (PRIMARY KEY)
- `owner_id`: `uuid` (NOT NULL, references `profiles.id` ON DELETE CASCADE)
- `shared_with_id`: `uuid` (NOT NULL, references `profiles.id` ON DELETE CASCADE)
- `permission`: `permission_type` (default: 'view')
- `created_at`: `timestamp with time zone` (default: `now()`)
- *Constraint:* `UNIQUE (owner_id, shared_with_id)`

#### 4. person_links (Связывание / Слияние узлов)
- `id`: `uuid` (PRIMARY KEY)
- `person_a_id`: `uuid` (NOT NULL, references `people.id` ON DELETE CASCADE)
- `person_b_id`: `uuid` (NOT NULL, references `people.id` ON DELETE CASCADE)
- `status`: `request_status` (default: 'pending')
- `requested_by`: `uuid` (references `profiles.id`)
- `is_ai_suggested`: `boolean` (default: false) — маркер того, что связь нашел ИИ
- `created_at`: `timestamp with time zone` (default: `now()`)

#### 5. archive_records (Документы) & timeline_events (Хронология)
- Связаны с `people.id` через `person_id` (`ON DELETE CASCADE`).

---

## 3. План реализации по этапам

### Этап 1 — Аутентификация, Роли и RLS (Supabase)
1. **Инициализация БД:** Накат структуры таблиц и типов.
2. **Настройка политик RLS (Row Level Security):**
   - **Для пользователей:** Разрешить доступ (`SELECT/UPDATE`), если `auth.uid() == user_id` ИЛИ если есть запись в `tree_permissions` со статусом `shared_with_id == auth.uid()`.
   - **Для Администраторов (Суперпользователей):** Добавить во все политики RLS проверку роли: 
     `USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )`. Если админ — RLS полностью отключается для этой сессии (полный доступ на просмотр и редактирование любых деревьев в системе для модерации и техподдержки).

### Этап 2 — Адаптивный UI и Graph Engine (Mobile + Desktop)
1. **Разработка интерфейса (Mobile-First):**
   - **Desktop:** Полноэкранный интерактивный бесконечный холст (Pan & Zoom) для отрисовки дерева с помощью Framer Motion.
   - **Mobile (Смартфоны):** Переключение графа в режим адаптивного списка/хронологии или оптимизированного компактного дерева (свайпы для перехода между поколениями, раскрывающиеся списки детей/родителей), так как гигантский холст неудобен на экранах телефонов. Удобные Bottom Sheets (выезжающие снизу шторки) для редактирования профилей на мобильных.

### Этап 3 — Логика шеринга, объединения и AI-Matching Engine
1. **Tree Sharing:** Шеринг по email. Запись в `tree_permissions`.
2. **Система двустороннего связывания:** Эндпоинты для отправки, принятия и отклонения запросов родственников. Центр уведомлений (Inbox).
3. **Движок конфликтов данных:** Если узлы связаны, интерфейс подсвечивает расхождения (разные даты рождения или фамилии) и дает выбрать приоритетную версию.
4. **AI-Matching Engine (Поиск пересечений):**
   - Периодическая фоновая задача (или триггер по кнопке "Найти родственников"), которая отправляет ИИ-эндпоинту текстовые дескрипторы ключевых предков (ФИО, даты, места рождения).
   - Google AI анализирует данные разных пользователей на предмет схожести (с учетом опечаток, вариаций имен вроде "Иван/Иоанн", изменений границ областей/городов).
   - При нахождении совпадения ИИ создает запись в `person_links` со статусом `pending` и флагом `is_ai_suggested = true`. Пользователь видит подсказку: *"ИИ считает, что ваш прадед совпадает с прадедом пользователя X. Связать деревья?"*.

### Этап 4 — Панель Администратора (Admin Dashboard)
1. Эксклюзивный роут `/admin`, доступный только пользователям с `role = 'admin'`.
2. Возможности:
   - Просмотр списка всех зарегистрированных пользователей и общего количества деревьев.
   - Прямой переход в режим "Просмотр дерева глазами конкретного пользователя" (благодаря обходу RLS).
   - Инструменты модерации, удаление спама/некорректных карточек.

### Этап 5 — Деплой
1. Клиентская часть $\rightarrow$ Vercel.
2. API эндпоинты (AI Matching, Bio Generation) $\rightarrow$ Vercel Serverless Functions.