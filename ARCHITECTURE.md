# Architecture Overview

## Stack

- Flask app in [main.py](main.py) using Flask-Bootstrap, Flask-Login, Flask-CKEditor, SQLAlchemy ORM, WTForms.
- Persistence: SQLite by default, configurable via `DB_URI` (PostgreSQL supported). Models defined in [main.py](main.py).
- Templates under [templates/](templates/) and static assets under [static/](static/).
- Forms defined in [forms.py](forms.py). Email via Resend's HTTP API using env creds.

## Runtime Topology

- Single Flask process (can be run via `python main.py` or WSGI entry for PaaS) serving HTTP and rendering Jinja templates.
- App is stateful only through the database; sessions managed via Flask-Login cookies; static assets served from `static/`.

## Request Flows

- Home/index: `GET /` (and `/page/<page>`) reads posts via raw SQL, paginates, renders `index.html` with excerpt/reading-time filters.
- Post detail: `GET|POST /post/<id>` loads a post, renders `post.html`, allows authenticated comments and shows like counts.
- Auth: `GET|POST /register`, `/login`, `/logout` using hashed passwords; session cookies managed by Flask-Login.
- Admin-only (user id == 1): create/edit/delete posts (`/new-post`, `/edit-post/<id>`, `/delete/<id>`); delete comments.
- Comment edit: owner or admin can edit (`/edit-comment/<id>`).
- Likes: AJAX endpoints `/like-post/<post_id>` and `/like-comment/<comment_id>` toggle likes and return JSON counts.
- Static pages: `/about`, `/contact` (sends email via Resend's HTTP API).
- Maintenance: `/migrate-db` adds tags column (Postgres), `/debug-db` dumps schema/counts.

## Data Model (SQLAlchemy)

- `BlogPost`: id, author_id -> User, title, subtitle, date (string), body (HTML), img_url, tags (comma-separated string), comments relationship.
- `User`: id, email (unique), password hash, name, relationships to posts and comments; `UserMixin` for Flask-Login.
- `Comment`: id, text, author_id -> User, post_id -> BlogPost.
- `PostLike`: id, user_id -> User, post_id -> BlogPost, created_at.
- `CommentLike`: id, user_id -> User, comment_id -> Comment, created_at.

## Forms & Validation

- `CreatePostForm`: title/subtitle/img_url/body/tags (comma-separated), CKEditor for body.
- `RegisterForm`, `LoginForm`, `CommentForm` with required validation; URL validation on image URLs.

## AuthZ Rules

- Auth required to comment/like; admin is hard-coded as user id 1 for post CRUD and comment deletion.
- Comment edit allowed for comment owner or admin.

## Templates/Rendering

- Jinja filters in [main.py](main.py): `clean_excerpt`, `reading_time`, `get_tags` used in `index.html` and `post.html` to display summaries and tags.
- Layout assembled via partials ([templates/header.html](templates/header.html), [templates/footer.html](templates/footer.html)).

## Email/Contact

- `/contact` posts to Resend's HTTP API (`RESEND_API_KEY`) from the sandbox sender, delivering to `EMAIL_KEY` (address). Sends message to self. SMTP is not used since Render blocks outbound SMTP on all plans.

## Environment & Config

- `SECRET_KEY` from `FLASK_KEY` env; DB from `DB_URI` (default `sqlite:///posts.db`).
- CKEditor/Bootstrap initialized at app start; Gravatar for comment avatars.

## Deployment Notes

- Suitable for single-container PaaS (e.g., Render/Fly/Heroku) with Procfile available. Use gunicorn/Waitress for production WSGI.
- Ensure env vars set: `FLASK_KEY`, `DB_URI`, `EMAIL_KEY`, `RESEND_API_KEY`.
- For Postgres, run `/migrate-db` once to ensure `tags` column exists.

## Observability & Ops

- Minimal built-in logging via `print` in `get_all_posts`; no structured logging/metrics yet. Add error tracking (Sentry) and access logging at the server layer for production.

## Scaling Considerations

- Vertical scale or run multiple app instances behind a load balancer; app is stateless apart from DB/sessions.
- Move static assets to CDN/object storage if traffic grows. Add caching (Redis) for hot pages and like counts if needed.
- Replace raw SQL in list view with paginated ORM queries for DB efficiency; add indexes on foreign keys and likes tables for growth.
