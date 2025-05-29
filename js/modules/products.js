// Products page functionality
import { nakodaAPI } from './modules/api.js';
import { Utils } from './modules/utils.js';

class ProductsPage {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadProducts();
        this.setupScrollAnimations();
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target.dataset.filter);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }

        // Quote request modal
        const quoteBtn = document.getElementById('request-quote-btn');
        const quoteModal = document.getElementById('quote-modal');
        if (quoteBtn && quoteModal) {
            quoteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal('quote-modal');
            });
        }

        // Quote form submission
        const quoteForm = document.getElementById('quote-form');
        if (quoteForm) {
            quoteForm.addEventListener('submit', (e) => {
                this.handleQuoteSubmission(e);
            });
        }

        // Modal close functionality
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal').id);
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    async loadProducts() {
        const loadingEl = document.getElementById('products-loading');
        const gridEl = document.getElementById('products-grid');
        
        try {
            // Show loading state
            loadingEl.style.display = 'block';
            gridEl.style.display = 'none';

            // Try to load from API first, fallback to local data
            try {
                this.products = await nakodaAPI.getBrassWireProducts();
            } catch (apiError) {
                console.log('API not available, loading local data...');
                this.products = await this.loadLocalProducts();
            }

            this.filteredProducts = [...this.products];
            this.renderProducts();

            // Hide loading, show grid
            loadingEl.style.display = 'none';
            gridEl.style.display = 'grid';

        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please try again later.');
        }
    }

    async loadLocalProducts() {
        // Fallback to local JSON data
        const response = await fetch('data/products.json');
        const data = await response.json();
        return data.brassWires;
    }

    renderProducts() {
        const gridEl = document.getElementById('products-grid');
        const noProductsEl = document.getElementById('no-products');

        if (this.filteredProducts.length === 0) {
            gridEl.style.display = 'none';
            noProductsEl.style.display = 'block';
            return;
        }

        noProductsEl.style.display = 'none';
        gridEl.style.display = 'grid';

        gridEl.innerHTML = this.filteredProducts.map(product => this.createProductCard(product)).join('');

        // Add click listeners to product cards
        gridEl.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                this.showProductDetails(productId);
            });
        });

        // Add quick quote listeners
        gridEl.querySelectorAll('.btn-quick-quote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.closest('.product-card').dataset.productId;
                this.openQuoteModal(productId);
            });
        });
    }

    createProductCard(product) {
        const featuredClass = product.featured ? 'featured' : '';
        const stockClass = !product.inStock ? 'out-of-stock' : '';
        
        return `
            <div class="product-card ${featuredClass} ${stockClass}" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.thumbnail}" alt="${product.name}" loading="lazy">
                    <div class="diameter-badge">${product.diameter}${product.unit}</div>
                </div>
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.material}</p>
                    
                    <div class="product-specs">
                        <div class="spec-item">
                            <span class="spec-label">Tensile Strength:</span>
                            <span class="spec-value">${product.tensileStrength}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Stock Status:</span>
                            <span class="spec-value ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                                ${product.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="product-applications">
                        <h4>Applications:</h4>
                        <div class="applications-list">
                            ${product.applications.slice(0, 3).map(app => 
                                `<span class="application-tag">${app}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="product-price">${product.priceRange}</div>
                    
                    <div class="product-actions">
                        <button class="btn-view-details">View Details</button>
                        <button class="btn-quick-quote" ${!product.inStock ? 'disabled' : ''}>
                            Quick Quote
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    handleFilterChange(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.currentFilter = filter;
        this.applyFilters();
    }

    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase();
        this.applyFilters();
    }

    applyFilters() {
        this.filteredProducts = this.products.filter(product => {
            // Apply category filter
            let matchesFilter = true;
            
            switch (this.currentFilter) {
                case 'featured':
                    matchesFilter = product.featured;
                    break;
                case 'fine':
                    matchesFilter = parseFloat(product.diameter) <= 0.5;
                    break;
                case 'standard':
                    const diameter = parseFloat(product.diameter);
                    matchesFilter = diameter > 0.5 && diameter <= 2.0;
                    break;
                case 'heavy':
                    matchesFilter = parseFloat(product.diameter) > 2.0;
                    break;
                case 'in-stock':
                    matchesFilter = product.inStock;
                    break;
                default:
                    matchesFilter = true;
            }

            // Apply search filter
            let matchesSearch = true;
            if (this.searchTerm) {
                const searchFields = [
                    product.name,
                    product.diameter + product.unit,
                    product.material,
                    ...product.applications
                ].join(' ').toLowerCase();
                
                matchesSearch = searchFields.includes(this.searchTerm);
            }

            return matchesFilter && matchesSearch;
        });

        this.renderProducts();
    }

    async showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = this.createProductDetailsHTML(product);
        
        this.openModal('product-modal');
    }

    createProductDetailsHTML(product) {
        return `
            <div class="modal-product-header">
                <div class="modal-product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="modal-product-info">
                    <h2>${product.name}</h2>
                    <p class="product-price">${product.priceRange}</p>
                    <p>${product.material}</p>
                    <div class="stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                        <i class="fas ${product.inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${product.inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                </div>
            </div>
            
            <div class="modal-specs-grid">
                <div class="spec-group">
                    <h4>Physical Properties</h4>
                    <div class="spec-item">
                        <span class="spec-label">Diameter:</span>
                        <span class="spec-value">${product.diameter}${product.unit}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Tensile Strength:</span>
                        <span class="spec-value">${product.tensileStrength}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Composition:</span>
                        <span class="spec-value">${product.specifications.composition}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Tolerance:</span>
                        <span class="spec-value">${product.specifications.tolerance}</span>
                    </div>
                </div>
                
                <div class="spec-group">
                    <h4>Manufacturing Details</h4>
                    <div class="spec-item">
                        <span class="spec-label">Finish:</span>
                        <span class="spec-value">${product.specifications.finish}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Packaging:</span>
                        <span class="spec-value">${product.specifications.packaging}</span>
                    </div>
                </div>
            </div>
            
            <div class="applications-section">
                <h4>Recommended Applications</h4>
                <div class="applications-list">
                    ${product.applications.map(app => 
                        `<span class="application-tag">${app}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="nakodaProducts.openQuoteModal('${product.id}')">
                    Request Quote
                </button>
                <a href="index.html#contact" class="btn btn-secondary">Contact Us</a>
            </div>
        `;
    }

    openQuoteModal(productId = null) {
        if (productId) {
            const product = this.products.find(p => p.id === productId);
            if (product) {
                document.getElementById('quote-diameter').value = `${product.diameter}${product.unit}`;
                document.getElementById('quote-specifications').value = `Interested in ${product.name}`;
            }
        }
        this.closeModal('product-modal');
        this.openModal('quote-modal');
    }

    async handleQuoteSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const quoteData = Object.fromEntries(formData.entries());
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Try API submission, fallback to email
            try {
                await nakodaAPI.requestQuote(quoteData);
            } catch (apiError) {
                // Fallback: create mailto link
                this.createMailtoLink(quoteData);
            }
            
            this.showNotification('Quote request sent successfully! We\'ll respond within 24 hours.', 'success');
            this.closeModal('quote-modal');
            e.target.reset();
            
        } catch (error) {
            console.error('Error submitting quote:', error);
            this.showNotification('Failed to send quote request. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    createMailtoLink(quoteData) {
        const subject = `Quote Request - ${quoteData.diameter} Brass Wire`;
        const body = `
Name: ${quoteData.name}
Company: ${quoteData.company || 'N/A'}
Email: ${quoteData.email}
Phone: ${quoteData.phone || 'N/A'}
Wire Diameter: ${quoteData.diameter}
Quantity: ${quoteData.quantity}
Application: ${quoteData.application}
Special Requirements: ${quoteData.specifications || 'None'}
        `.trim();
        
        const mailtoLink = `mailto:info@nakodametals.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} show`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    showError(message) {
        const loadingEl = document.getElementById('products-loading');
        loadingEl.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Products</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-scroll]').forEach(el => {
            observer.observe(el);
        });
    }
}

// Initialize products page
const nakodaProducts = new ProductsPage();

// Make it globally available for modal actions
window.nakodaProducts = nakodaProducts;
