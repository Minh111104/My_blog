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

// Like Comment functionality
function toggleCommentLike(commentId) {
    const likeBtn = document.getElementById(`comment-like-btn-${commentId}`);
    const likeCountSpan = document.getElementById(`comment-like-count-${commentId}`);
    
    // Disable button during request
    likeBtn.disabled = true;
    
    fetch(`/like-comment/${commentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update like count
            likeCountSpan.textContent = data.like_count;
            
            // Toggle button state
            if (data.action === 'liked') {
                likeBtn.classList.add('liked');
                likeBtn.title = 'Unlike';
                // Add animation
                likeBtn.classList.add('animate-like');
                setTimeout(() => likeBtn.classList.remove('animate-like'), 600);
            } else {
                likeBtn.classList.remove('liked');
                likeBtn.title = 'Like';
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

// Dark mode toggle functionality
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    });
}

// Load dark mode preference on page load
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// TOC Collapse/Expand functionality
document.addEventListener('DOMContentLoaded', function() {
    const tocToggle = document.getElementById('toc-toggle');
    const tocContainer = document.getElementById('table-of-contents');
    const tocColumn = document.getElementById('toc-column');
    const mainContentColumn = document.getElementById('main-content-column');
    
    if (tocToggle && tocContainer && tocColumn && mainContentColumn) {
        // Load saved TOC state
        const tocCollapsed = localStorage.getItem('tocCollapsed') === 'true';
        if (tocCollapsed) {
            tocContainer.classList.add('collapsed');
            expandMainContent();
        }
        
        tocToggle.addEventListener('click', function() {
            const isCollapsed = tocContainer.classList.toggle('collapsed');
            localStorage.setItem('tocCollapsed', isCollapsed);
            
            if (isCollapsed) {
                expandMainContent();
            } else {
                restoreMainContent();
            }
        });
        
        function expandMainContent() {
            // Expand main content to take up more space
            mainContentColumn.classList.remove('col-lg-8', 'col-xl-7');
            mainContentColumn.classList.add('col-lg-11', 'col-xl-10');
        }
        
        function restoreMainContent() {
            // Restore original width
            mainContentColumn.classList.remove('col-lg-11', 'col-xl-10');
            mainContentColumn.classList.add('col-lg-8', 'col-xl-7');
        }
    }
});

// Table of Contents Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    const tocContainer = document.getElementById('table-of-contents');
    const tocList = document.getElementById('toc-list');
    const postContent = document.getElementById('post-content');
    
    if (!tocContainer || !tocList || !postContent) return;
    
    // Get all headings from the post content
    const headings = postContent.querySelectorAll('h1, h2, h3, h4');
    
    if (headings.length === 0) {
        // Hide TOC if no headings found and center the content
        tocContainer.style.display = 'none';
        // Add class to center the main content when TOC is hidden
        const mainContentCol = document.querySelector('.col-lg-8');
        if (mainContentCol) {
            mainContentCol.classList.remove('col-lg-8');
            mainContentCol.classList.add('col-lg-10', 'col-xl-8');
        }
        return;
    }
    
    // Generate TOC
    let tocHTML = '';
    headings.forEach((heading, index) => {
        // Add an ID to each heading if it doesn't have one
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }
        
        const level = heading.tagName.toLowerCase();
        const text = heading.textContent.trim();
        const id = heading.id;
        
        // Add appropriate class based on heading level
        const className = level === 'h3' || level === 'h4' ? 'toc-h3' : '';
        tocHTML += `<li class="${className}"><a href="#${id}" data-target="${id}">${text}</a></li>`;
    });
    
    tocList.innerHTML = tocHTML;
    
    // Smooth scroll to heading
    const tocLinks = tocList.querySelectorAll('a');
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offset = 100; // Offset for fixed header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Highlight active section on scroll (with sticky TOC support)
    function highlightActiveSection() {
        let currentActive = null;
        const scrollPosition = window.scrollY + 200;
        
        // Find the current active heading
        headings.forEach(heading => {
            const headingTop = heading.getBoundingClientRect().top + window.pageYOffset;
            
            if (scrollPosition >= headingTop - 50) {
                currentActive = heading.id;
            }
        });
        
        // Remove all active classes
        tocLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to current section
        if (currentActive) {
            const activeLink = tocList.querySelector(`a[data-target="${currentActive}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
                
                // Auto-scroll TOC to keep active item visible
                const tocNav = document.getElementById('toc-nav');
                if (tocNav && activeLink) {
                    const linkRect = activeLink.getBoundingClientRect();
                    const navRect = tocNav.getBoundingClientRect();
                    
                    if (linkRect.bottom > navRect.bottom || linkRect.top < navRect.top) {
                        activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                }
            }
        }
    }
    
    // Throttle scroll event for performance
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(highlightActiveSection);
    });
    
    // Initial highlight
    highlightActiveSection();
});
