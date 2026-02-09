# 💸 EquiPay – Expense Sharing App

A full-stack expense sharing application inspired by Splitwise that helps users track shared expenses, manage group finances, and settle balances easily.

Live Demo: https://equi-pay-xi.vercel.app/
---

## 🚀 Features

### 👤 Authentication
- Firebase Authentication
- Secure user login & signup
- Session persistence

### 💰 Expense Management
- Add shared expenses
- Split expenses between friends or groups
- Track who owes whom

### 👥 Friends System
- Add friends via email search
- Maintain private expense tracking
- Mutual balance tracking

### 👨‍👩‍👧 Group Expenses
- Create groups
- Add multiple participants
- Group level balance calculation
- Simplified debt distribution

### 🤝 Smart Settlement
- Settle balances between users
- Supports group + private settlements
- Dashboard shows real-time balance updates

### 📊 Dashboard
- Overall balance summary
- Pending payments
- Simplified debt overview

---

## 📸 Screen Previews
<img width="469" height="328" alt="image" src="https://github.com/user-attachments/assets/16414e90-63c6-4482-a002-dad011e5a8a9" />
<img width="960" height="474" alt="image" src="https://github.com/user-attachments/assets/9df65455-eecc-4d46-afc5-9b3cbd4dc61a" />
<img width="955" height="468" alt="image" src="https://github.com/user-attachments/assets/5c86dbe8-cdcb-4bc9-a258-8b0a7a13a0e3" />
<img width="959" height="471" alt="image" src="https://github.com/user-attachments/assets/fef0fe3b-d08b-40d1-b48d-f157591dc6df" />

## 🛠 Tech Stack

### Frontend
- React (Vite)
- Context API (State Management)
- Firebase Authentication
- Recharts (Data Visualization)
- Lucide Icons
- Socket.io

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Deployment
- Frontend → Vercel
- Backend → Render
- Authentication → Firebase

---

## 📂 Project Structure
client/
 ├── components
 ├── context
 ├── pages
 ├── services
 └── utils

server/
 ├── routes
 ├── models
 ├── middleware
 └── config
 
🧪 Running Locally
Clone Repository
git clone https://github.com/aniketray01/EquiPay

Install Dependencies
Frontend
cd client
npm install
npm run dev

Backend
cd server
npm install
npm start

## 🧠 Core App Logic

The application uses a transaction-based ledger system:

- Every expense creates debt records  
- Every settlement creates settlement records  
- All balances are dynamically calculated  
- Prevents mismatch between group and dashboard balances
- 🔔 Real-time notifications (Socket.IO)
- 📊 Expense analytics
- 📱 Enhanced mobile responsiveness  
- 🔁 Recurring expenses
 - 📄 Export financial reports  

---

## 🔐 Security Notes

- Firebase manages authentication  
- Environment variables secured  
- Backend protected via CORS configuration  

---

## 📈 Future Improvements

- 💳 Payment gateway integration  

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 👨‍💻 Author

**Aniket Ray**  
Full Stack Developer  

GitHub: https://github.com/aniketray01  
LinkedIn: https://www.linkedin.com/in/aniket-ray/

---

## ⭐ Show Your Support

If you like this project, give it a ⭐ on GitHub!


