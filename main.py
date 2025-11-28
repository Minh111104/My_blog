from datetime import date
from flask import Flask, abort, render_template, redirect, url_for, flash, request
from flask_bootstrap import Bootstrap5
from flask_ckeditor import CKEditor
from flask_gravatar import Gravatar
from flask_login import UserMixin, login_user, LoginManager, current_user, logout_user
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship, DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String, Text, text
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from forms import CreatePostForm, RegisterForm, LoginForm, CommentForm
import smtplib
import os
from dotenv import load_dotenv
import re
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_KEY')
ckeditor = CKEditor(app)
Bootstrap5(app)

# Custom Jinja filter to strip HTML tags and truncate text
@app.template_filter('clean_excerpt')
def clean_excerpt(text, length=150):
    # Remove HTML tags
    clean_text = re.sub(r'<[^>]+>', '', text)
    # Remove HTML entities
    clean_text = clean_text.replace('&nbsp;', ' ')
    clean_text = clean_text.replace('&amp;', '&')
    clean_text = clean_text.replace('&lt;', '<')
    clean_text = clean_text.replace('&gt;', '>')
    clean_text = clean_text.replace('&quot;', '"')
    clean_text = clean_text.replace('&#39;', "'")
    # Handle common entities
    clean_text = re.sub(r'&[a-zA-Z]+;', '', clean_text)
    clean_text = re.sub(r'&#\d+;', '', clean_text)
    # Truncate to specified length
    if len(clean_text) > length:
        clean_text = clean_text[:length].rsplit(' ', 1)[0] + '...'
    return clean_text

# Custom Jinja filter to calculate reading time
@app.template_filter('reading_time')
def reading_time(text):
    try:
        if not text:
            return 1
        # Remove HTML tags for accurate word count
        clean_text = re.sub(r'<[^>]+>', '', text)
        # Count words (split by whitespace)
        word_count = len(clean_text.split())
        # Average reading speed: 200 words per minute
        reading_minutes = max(1, round(word_count / 200))
        return reading_minutes
    except:
        return 1

# Custom Jinja filter to get post tags
@app.template_filter('get_tags')
def get_tags(tags_string):
    try:
        if not tags_string:
            return []
        # Split by comma and clean up whitespace
        tags = [tag.strip() for tag in tags_string.split(',') if tag.strip()]
        return tags
    except:
        return []

# Safe way to get tags that works even if column doesn't exist
def safe_get_tags(post):
    try:
        if hasattr(post, 'tags') and post.tags:
            return get_tags(post.tags)
        return []
    except:
        return []


# Migration function removed for production stability


# Configure Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return db.get_or_404(User, user_id)


# For adding profile images to the comment section
gravatar = Gravatar(app,
                    size=100,
                    rating='g',
                    default='retro',
                    force_default=False,
                    force_lower=False,
                    use_ssl=False,
                    base_url=None)

# CREATE DATABASE
class Base(DeclarativeBase):
    pass
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DB_URI", "sqlite:///posts.db")
db = SQLAlchemy(model_class=Base)
db.init_app(app)


# CONFIGURE TABLES
class BlogPost(db.Model):
    __tablename__ = "blog_posts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Create Foreign Key, "users.id" the users refers to the tablename of User.
    author_id: Mapped[int] = mapped_column(Integer, db.ForeignKey("users.id"))
    # Create reference to the User object. The "posts" refers to the posts property in the User class.
    author = relationship("User", back_populates="posts")
    title: Mapped[str] = mapped_column(String(250), unique=True, nullable=False)
    subtitle: Mapped[str] = mapped_column(String(250), nullable=False)
    date: Mapped[str] = mapped_column(String(250), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    img_url: Mapped[str] = mapped_column(String(250), nullable=False)
    tags: Mapped[str] = mapped_column(String(500), nullable=True)  # Store tags as comma-separated string
    # Parent relationship to the comments
    comments = relationship("Comment", back_populates="parent_post")


# Create a User table for all your registered users
class User(UserMixin, db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(100))
    # This will act like a list of BlogPost objects attached to each User.
    # The "author" refers to the author property in the BlogPost class.
    posts = relationship("BlogPost", back_populates="author")
    # Parent relationship: "comment_author" refers to the comment_author property in the Comment class.
    comments = relationship("Comment", back_populates="comment_author")


# Create a table for the comments on the blog posts
class Comment(db.Model):
    __tablename__ = "comments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # Child relationship:"users.id" The users refers to the tablename of the User class.
    # "comments" refers to the comments property in the User class.
    author_id: Mapped[int] = mapped_column(Integer, db.ForeignKey("users.id"))
    comment_author = relationship("User", back_populates="comments")
    # Child Relationship to the BlogPosts
    post_id: Mapped[str] = mapped_column(Integer, db.ForeignKey("blog_posts.id"))
    parent_post = relationship("BlogPost", back_populates="comments")


with app.app_context():
    db.create_all()


# Create an admin-only decorator
def admin_only(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # If id is not 1 then return abort with 403 error
        if current_user.id != 1:
            return abort(403)
        # Otherwise continue with the route function
        return f(*args, **kwargs)

    return decorated_function


# Register new users into the User database
@app.route('/register', methods=["GET", "POST"])
def register():
    form = RegisterForm()
    if form.validate_on_submit():

        # Check if user email is already present in the database.
        result = db.session.execute(db.select(User).where(User.email == form.email.data))
        user = result.scalar()
        if user:
            # User already exists
            flash("You've already signed up with that email, log in instead!")
            return redirect(url_for('login'))

        hash_and_salted_password = generate_password_hash(
            form.password.data,
            method='pbkdf2:sha256',
            salt_length=8
        )
        new_user = User(
            email=form.email.data,
            name=form.name.data,
            password=hash_and_salted_password,
        )
        db.session.add(new_user)
        db.session.commit()
        # This line will authenticate the user with Flask-Login
        login_user(new_user)
        return redirect(url_for("get_all_posts"))
    return render_template("register.html", form=form, current_user=current_user)


@app.route('/login', methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        password = form.password.data
        result = db.session.execute(db.select(User).where(User.email == form.email.data))
        # Note, email in db is unique so will only have one result.
        user = result.scalar()
        # Email doesn't exist
        if not user:
            flash("That email does not exist, please try again.")
            return redirect(url_for('login'))
        # Password incorrect
        elif not check_password_hash(user.password, password):
            flash('Password incorrect, please try again.')
            return redirect(url_for('login'))
        else:
            login_user(user)
            return redirect(url_for('get_all_posts'))

    return render_template("login.html", form=form, current_user=current_user)


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('get_all_posts'))


@app.route('/')
@app.route('/page/<int:page>')
def get_all_posts(page=1):
    try:
        # Use raw SQL to select all columns including tags
        result = db.session.execute(text("SELECT id, author_id, title, subtitle, date, body, img_url, tags FROM blog_posts ORDER BY id DESC"))
        all_posts = []
        print(f"Found {result.rowcount} posts in database")
        
        for row in result:
            print(f"Processing post: {row[2]} (ID: {row[0]})")
            # Create a simple object with the data we have
            post_data = {
                'id': row[0],
                'author_id': row[1],
                'title': row[2],
                'subtitle': row[3],
                'date': row[4],
                'body': row[5],
                'img_url': row[6],
                'tags': row[7] if row[7] else 'Personal'  # Use actual tags from database
            }
            # Create a mock object that mimics the BlogPost structure
            mock_post = type('BlogPost', (), post_data)()
            
            # Add the author relationship
            try:
                author = db.get_or_404(User, row[1])
                mock_post.author = author
                print(f"  - Author: {author.name}")
            except:
                # If author not found, create a mock author
                mock_post.author = type('User', (), {'name': 'Unknown Author'})()
                print(f"  - Author: Unknown Author")
            
            all_posts.append(mock_post)
            print(f"  - Post added successfully")
        
        print(f"Total posts processed: {len(all_posts)}")
        
        # Pagination logic
        posts_per_page = 5
        total_posts = len(all_posts)
        total_pages = (total_posts + posts_per_page - 1) // posts_per_page  # Ceiling division
        
        # Validate page number
        if page < 1:
            page = 1
        elif page > total_pages and total_pages > 0:
            page = total_pages
        
        # Calculate start and end indices for slicing
        start_idx = (page - 1) * posts_per_page
        end_idx = start_idx + posts_per_page
        posts = all_posts[start_idx:end_idx]
        
    except Exception as e:
        # Last resort: return empty list
        print(f"Error in get_all_posts: {e}")
        posts = []
        total_pages = 0
        page = 1
    
    return render_template("index.html", all_posts=posts, current_user=current_user, 
                         current_page=page, total_pages=total_pages)

# Migration route to add tags column
@app.route('/migrate-db')
def migrate_database():
    try:
        # Check database type
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        is_postgresql = 'postgresql' in db_uri
        
        if is_postgresql:
            # Add tags column to PostgreSQL
            try:
                db.session.execute(text("ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT 'Personal'"))
                db.session.commit()
                
                # Update existing posts with default tags
                db.session.execute(text("UPDATE blog_posts SET tags = 'Personal' WHERE tags IS NULL OR tags = ''"))
                db.session.commit()
                
                return """
                <h1>Database Migration Successful!</h1>
                <p>✅ Added tags column to blog_posts table</p>
                <p>✅ Updated existing posts with default 'Personal' tags</p>
                <p><a href="/">← Back to Homepage</a></p>
                """
                
            except Exception as e:
                return f"""
                <h1>Migration Error</h1>
                <p>❌ Error: {str(e)}</p>
                <p><a href="/">← Back to Homepage</a></p>
                """
        else:
            return """
            <h1>Migration Not Needed</h1>
            <p>This is running locally with SQLite - no migration needed.</p>
            <p><a href="/">← Back to Homepage</a></p>
            """
            
    except Exception as e:
        return f"<h1>Migration Error</h1><p>{str(e)}</p>"

# Debug route to check database content
@app.route('/debug-db')
def debug_database():
    try:
        # Check database type
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        is_postgresql = 'postgresql' in db_uri
        
        if is_postgresql:
            # PostgreSQL - use information_schema
            tables_result = db.session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in tables_result]
            
            columns_result = db.session.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'blog_posts'"))
            columns = [(row[0], row[1]) for row in columns_result]
        else:
            # SQLite - use pragma
            tables_result = db.session.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in tables_result]
            
            # For SQLite, we'll get columns from the model instead
            columns = [(col.key, str(col.type)) for col in BlogPost.__table__.columns]
        
        # Count posts
        posts_count = db.session.execute(text("SELECT COUNT(*) FROM blog_posts")).scalar()
        
        # Count users
        users_count = db.session.execute(text("SELECT COUNT(*) FROM users")).scalar()
        
        return f"""
        <h1>Database Debug Info</h1>
        <h2>Database Type:</h2>
        <p>{'PostgreSQL' if is_postgresql else 'SQLite'}</p>
        
        <h2>Tables:</h2>
        <ul>{''.join([f'<li>{table}</li>' for table in tables])}</ul>
        
        <h2>Blog Posts Table Columns:</h2>
        <ul>{''.join([f'<li>{col[0]} ({col[1]})</li>' for col in columns])}</ul>
        
        <h2>Counts:</h2>
        <p>Posts: {posts_count}</p>
        <p>Users: {users_count}</p>
        """
        
    except Exception as e:
        return f"<h1>Database Error</h1><p>{str(e)}</p>"


# Add a POST method to be able to post comments
@app.route("/post/<int:post_id>", methods=["GET", "POST"])
def show_post(post_id):
    requested_post = db.get_or_404(BlogPost, post_id)
    # Add the CommentForm to the route
    comment_form = CommentForm()
    # Only allow logged-in users to comment on posts
    if comment_form.validate_on_submit():
        if not current_user.is_authenticated:
            flash("You need to login or register to comment.")
            return redirect(url_for("login"))

        new_comment = Comment(
            text=comment_form.comment_text.data,
            comment_author=current_user,
            parent_post=requested_post
        )
        db.session.add(new_comment)
        db.session.commit()
    return render_template("post.html", post=requested_post, current_user=current_user, form=comment_form)


# Use a decorator so an admin or a user can edit comments
@app.route("/edit-comment/<int:comment_id>", methods=["GET", "POST"])
def edit_comment(comment_id):
    comment = db.get_or_404(Comment, comment_id)
    if not current_user.is_authenticated or (current_user.id != comment.comment_author.id and current_user.id != 1):
        abort(403)
    form = CommentForm(comment_text=comment.text)
    if form.validate_on_submit():
        comment.text = form.comment_text.data
        db.session.commit()
        return redirect(url_for('show_post', post_id=comment.parent_post.id))
    return render_template("edit_comment.html", form=form, comment=comment, current_user=current_user)


# Use a decorator so only an admin user can delete comments
@app.route("/delete-comment/<int:comment_id>", methods=["POST"])
def delete_comment(comment_id):
    comment = db.get_or_404(Comment, comment_id)
    if not current_user.is_authenticated or current_user.id != 1:
        abort(403)
    post_id = comment.parent_post.id
    db.session.delete(comment)
    db.session.commit()
    return redirect(url_for('show_post', post_id=post_id))


# Use a decorator so only an admin user can create new posts
@app.route("/new-post", methods=["GET", "POST"])
@admin_only
def add_new_post():
    form = CreatePostForm()
    if form.validate_on_submit():
        new_post = BlogPost(
            title=form.title.data,
            subtitle=form.subtitle.data,
            body=form.body.data,
            img_url=form.img_url.data,
            tags=form.tags.data,
            author=current_user,
            date=date.today().strftime("%B %d, %Y")
        )
        db.session.add(new_post)
        db.session.commit()
        return redirect(url_for("get_all_posts"))
    return render_template("make-post.html", form=form, current_user=current_user)


# Use a decorator so only an admin user can edit a post
@app.route("/edit-post/<int:post_id>", methods=["GET", "POST"])
def edit_post(post_id):
    post = db.get_or_404(BlogPost, post_id)
    edit_form = CreatePostForm(
        title=post.title,
        subtitle=post.subtitle,
        img_url=post.img_url,
        author=post.author,
        body=post.body,
        tags=post.tags
    )
    if edit_form.validate_on_submit():
        post.title = edit_form.title.data
        post.subtitle = edit_form.subtitle.data
        post.img_url = edit_form.img_url.data
        post.author = current_user
        post.body = edit_form.body.data
        post.tags = edit_form.tags.data
        db.session.commit()
        return redirect(url_for("show_post", post_id=post.id))
    return render_template("make-post.html", form=edit_form, is_edit=True, current_user=current_user)


# Use a decorator so only an admin user can delete a post
@app.route("/delete/<int:post_id>")
@admin_only
def delete_post(post_id):
    post_to_delete = db.get_or_404(BlogPost, post_id)
    db.session.delete(post_to_delete)
    db.session.commit()
    return redirect(url_for('get_all_posts'))


@app.route("/about")
def about():
    return render_template("about.html", current_user=current_user)


MAIL_ADDRESS = os.environ.get("EMAIL_KEY")
MAIL_APP_PW = os.environ.get("PASSWORD_KEY")


# Contact form route
@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "POST":
        data = request.form
        send_email(data["name"], data["email"], data["phone"], data["message"])
        return render_template("contact.html", msg_sent=True)
    return render_template("contact.html", msg_sent=False)


def send_email(name, email, phone, message):
    email_message = f"Subject:New Message\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nMessage:{message}"
    with smtplib.SMTP("smtp.gmail.com") as connection:
        connection.starttls()
        connection.login(MAIL_ADDRESS, MAIL_APP_PW)
        connection.sendmail(MAIL_ADDRESS, MAIL_ADDRESS, email_message)


if __name__ == "__main__":
    app.run(debug=True, port=5001)
