/*!
* Start Bootstrap - Clean Blog v6.0.9 (https://startbootstrap.com/theme/clean-blog)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-clean-blog/blob/master/LICENSE)
*/
window.addEventListener('DOMContentLoaded', () => {
    let scrollPos = 0;
    const mainNav = document.getElementById('mainNav');
    const headerHeight = mainNav.clientHeight;
    window.addEventListener('scroll', function() {
        const currentTop = document.body.getBoundingClientRect().top * -1;
        if (currentTop < scrollPos) {
            // Scrolling Up
            if (currentTop > 0 && mainNav.classList.contains('is-fixed')) {
                mainNav.classList.add('is-visible');
            } else {
                mainNav.classList.remove('is-visible', 'is-fixed');
            }
        } else {
            // Scrolling Down
            mainNav.classList.remove(['is-visible']);
            if (currentTop > headerHeight && !mainNav.classList.contains('is-fixed')) {
                mainNav.classList.add('is-fixed');
            }
        }
        scrollPos = currentTop;
    });
})

// Search functionality
function searchPosts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const postCards = document.querySelectorAll('.post-card');
    
    if (searchTerm === '') {
        // Show all posts if search is empty
        postCards.forEach(card => {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.6s ease-out';
        });
        return;
    }
    
    let foundPosts = 0;
    
    postCards.forEach(card => {
        const title = card.querySelector('.post-title').textContent.toLowerCase();
        const subtitle = card.querySelector('.post-subtitle').textContent.toLowerCase();
        const excerpt = card.querySelector('.post-excerpt').textContent.toLowerCase();
        const author = card.querySelector('.post-author').textContent.toLowerCase();
        
        // Get all tags for this post
        const tagElements = card.querySelectorAll('.post-category');
        let tags = '';
        tagElements.forEach(tag => {
            tags += tag.textContent.toLowerCase() + ' ';
        });
        
        if (title.includes(searchTerm) || 
            subtitle.includes(searchTerm) || 
            excerpt.includes(searchTerm) || 
            author.includes(searchTerm) ||
            tags.includes(searchTerm)) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.6s ease-out';
            foundPosts++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show "no results" message if no posts found
    showSearchResults(foundPosts, searchTerm);
}

// Show search results count
function showSearchResults(count, term) {
    let resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'searchResults';
        resultsDiv.className = 'search-results mb-4';
        document.querySelector('.search-section').after(resultsDiv);
    }
    
    if (count === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                <p>No posts found for "<strong>${term}</strong>"</p>
                <button class="btn btn-outline-secondary btn-sm" onclick="clearSearch()">Show All Posts</button>
            </div>
        `;
    } else {
        resultsDiv.innerHTML = `
            <div class="results-count">
                <p>Found <strong>${count}</strong> post${count === 1 ? '' : 's'} for "<strong>${term}</strong>"</p>
                <button class="btn btn-outline-secondary btn-sm" onclick="clearSearch()">Clear Search</button>
            </div>
        `;
    }
}

// Clear search and show all posts
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').remove();
    searchPosts();
}

// Add enter key support for search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchPosts();
            }
        });
    }
    
    // Back to top button functionality
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    }
});

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Reading Progress Bar functionality
document.addEventListener('DOMContentLoaded', function() {
    const progressBar = document.querySelector('.reading-progress-fill');
    
    if (progressBar) {
        window.addEventListener('scroll', function() {
            // Calculate scroll progress
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Calculate percentage (excluding the viewport height from total)
            const scrollableHeight = documentHeight - windowHeight;
            const scrollPercentage = (scrollTop / scrollableHeight) * 100;
            
            // Update progress bar width
            progressBar.style.width = Math.min(scrollPercentage, 100) + '%';
        });
    }
});

// Like Post functionality
function toggleLike(postId) {
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likeCount = document.getElementById(`like-count-${postId}`);
    const likeText = likeBtn.querySelector('.like-text');
    
    // Disable button during request
    likeBtn.disabled = true;
    
    fetch(`/like-post/${postId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update like count
            const count = data.like_count;
            likeCount.innerHTML = `<strong>${count}</strong> ${count === 1 ? 'like' : 'likes'}`;
            
            // Toggle button state
            if (data.action === 'liked') {
                likeBtn.classList.add('liked');
                likeText.textContent = 'Unlike';
                // Add animation
                likeBtn.classList.add('animate-like');
                setTimeout(() => likeBtn.classList.remove('animate-like'), 600);
            } else {
                likeBtn.classList.remove('liked');
                likeText.textContent = 'Like';
            }
        } else {
            alert(data.error || 'An error occurred');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update like. Please try again.');
    })
    .finally(() => {
        // Re-enable button
        likeBtn.disabled = false;
    });
}
