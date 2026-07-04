# 👟 Shoes Shopping — Fullstack E-commerce App

A fullstack e-commerce application for browsing shoes and managing a shopping cart, built with **Spring Boot** (backend), **React / Expo** (frontend), and **MySQL** (database).

This project was built as a personal/learning project to practice fullstack development: REST API design, state management with Redux, and connecting a mobile-friendly frontend to a relational database.

---

## 🚀 Tech Stack

| Layer      | Technology                                      |
|------------|--------------------------------------------------|
| Frontend   | React 19 / Expo, Redux Toolkit, Axios            |
| Backend    | Spring Boot 4, Spring Web, Spring Data JPA        |
| Database   | MySQL 8                                          |
| Tools      | Maven, npm                                       |

---

## ✨ Features

- Browse a catalog of shoe products
- Add / remove products from a shopping cart
- Cart data persisted in MySQL
- REST API consumed by the frontend via Axios
- CORS configured for local frontend ↔ backend communication

---

## 🏗️ Architecture

```
Frontend (React/Expo, port 3000)
        │  REST calls (Axios)
        ▼
Backend (Spring Boot, port 9090)
        │  Spring Data JPA
        ▼
Database (MySQL, port 3306)
```

---

## 📂 Project Structure

```
fullstack-shoes-shopping/
├── backend/          # Spring Boot REST API
│   ├── src/main/java # Models, Controllers, Services, Repositories, DTOs
│   └── src/main/resources
│       └── application.properties
├── frontend/          # React / Expo app
│   └── src/
│       ├── services/  # API calls (Axios)
│       └── components/
├── mysql_setup.sql    # Database schema & seed script
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Java 17+
- Node.js 18+ and npm
- MySQL 8+
- Maven (or use the included `mvnw` wrapper)

### 1. Clone the repository

```bash
git clone https://github.com/BrahmiFidaa/fullstack-shoes-shopping.git
cd fullstack-shoes-shopping
```

### 2. Set up the database

Create the database and a dedicated user in MySQL:

```sql
CREATE DATABASE shoestore;
CREATE USER 'shoestore_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON shoestore.* TO 'shoestore_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run the seed script:

```bash
mysql -u shoestore_user -p shoestore < mysql_setup.sql
```

### 3. Configure the backend

In `backend/src/main/resources/application.properties`, set your own credentials:

```properties
server.port=9090
spring.datasource.url=jdbc:mysql://localhost:3306/shoestore
spring.datasource.username=shoestore_user
spring.datasource.password=your_password_here
```

> ⚠️ Never commit real credentials to a public repo — use environment variables or a local `application-local.properties` (git-ignored) instead.

Run the backend:

```bash
cd backend
./mvnw spring-boot:run     # or mvnw.cmd on Windows
```

The API will be available at `http://localhost:9090/api`.

### 4. Configure and run the frontend

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

---

## 🔌 API Overview

| Method | Endpoint              | Description              |
|--------|------------------------|---------------------------|
| GET    | `/api/products`        | List all products         |
| GET    | `/api/products/{id}`   | Get a single product      |
| POST   | `/api/cart`             | Add item to cart          |
| GET    | `/api/cart`             | Get current cart          |
| DELETE | `/api/cart/{id}`        | Remove item from cart     |

> Update this table to match your actual controllers if endpoints differ.

---

## 🧭 Roadmap

- [ ] User authentication (JWT)
- [ ] Order management
- [ ] Payment integration
- [ ] Product search & filtering
- [ ] Image upload for products

---

## 👩‍💻 Author

**Fidaa Brahmi**
Feel free to reach out via GitHub for any questions about this project.
