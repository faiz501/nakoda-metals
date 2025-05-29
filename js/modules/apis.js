// API configuration and connection module
class NakodaAPI {
    constructor() {
        this.baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://api.nakodametals.com' 
            : 'http://localhost:3000';
        this.endpoints = {
            products: '/api/products',
            team: '/api/team',
            contact: '/api/contact',
            quotes: '/api/quotes'
        };
    }

    // Generic fetch method with error handling
    async fetchData(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Get all brass wire products
    async getBrassWireProducts() {
        return this.fetchData(this.endpoints.products + '/brass-wires');
    }

    // Get copper wire products
    async getCopperWireProducts() {
        return this.fetchData(this.endpoints.products + '/copper-wires');
    }

    // Get team members
    async getTeamMembers() {
        return this.fetchData(this.endpoints.team);
    }

    // Submit contact form
    async submitContactForm(formData) {
        return this.fetchData(this.endpoints.contact, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
    }

    // Request product quote
    async requestQuote(quoteData) {
        return this.fetchData(this.endpoints.quotes, {
            method: 'POST',
            body: JSON.stringify(quoteData)
        });
    }

    // Get product details by ID
    async getProductDetails(productId) {
        return this.fetchData(`${this.endpoints.products}/${productId}`);
    }
}

// Export singleton instance
export const nakodaAPI = new NakodaAPI();
