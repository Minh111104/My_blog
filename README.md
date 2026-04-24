# Minh's Flask Blog ✍🏻

Welcome to **M-Talks** – a modern, full-featured blogging platform built with Flask, SQLAlchemy, Bootstrap, and PostgreSQL. This project demonstrates user authentication, admin controls, posting blogs, and deployment to Render.

## 🚀 Features

- **User Registration & Login**  
  Secure authentication with hashed passwords.

- **Admin Panel**  
  The first registered user is the admin and can create, edit, or delete any post or comment.

- **Rich Text Editing**  
  Write posts and comments using CKEditor.

- **Table of Contents**
  Overview of a post.

- **Comment System**  
  Authenticated users can comment on posts. Admin can edit or delete any comment.

- **Profile Avatars**  
  Gravatar integration for user profile images.

- **Responsive Design**  
  Clean, mobile-friendly UI with Bootstrap.

- **Contact Form**  
  Send messages directly to the admin via email.

- **Deployment Ready**  
  Easily deployable to Render with PostgreSQL support and environment variable configuration.

## 🛠️ Tech Stack

- **Backend:** Flask, Flask-Login, Flask-WTF, Flask-CKEditor, Flask-Gravatar
- **Database:** SQLAlchemy ORM, PostgreSQL (production), SQLite (local/dev)
- **Frontend:** Bootstrap 5
- **Deployment:** Render.com
- **Other:** Gunicorn, python-dotenv

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Minh111104/My_blog.git
cd My_blog
```

### 2. Install dependencies

```bash
pip install -r [requirements.txt](http://_vscodecontentref_/0)
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```bash
FLASK_KEY=your-secret-key
DB_URI=sqlite:///posts.db  # or your PostgreSQL URI for production
EMAIL_KEY=your-email@gmail.com
PASSWORD_KEY=your-app-password
```

### 4. Run locally

```bash
python [main.py](http://_vscodecontentref_/1)
```

Visit `http://localhost:5000` in your browser.

## 🌐 Deployment

- Deploy to [Render](https://render.com/) or any cloud platform.
- Set all environment variables in your dashboard.
- Use PostgreSQL for production.

**Live Demo:**  
👉 [https://m-talks.onrender.com](https://m-talks.onrender.com)

## 👤 Admin Access

- The **first registered user** becomes the admin (id=1).
- Admin can create, edit, and delete any post or comment.

## 📬 Contact

For questions or feedback, use the contact form on the site.

## 📝 License

This project is for educational purposes.

**Happy blogging!**
