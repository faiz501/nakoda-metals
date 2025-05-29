// Team page functionality
class TeamPage {
    constructor() {
        this.teamMembers = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadTeamMembers();
        this.setupScrollAnimations();
    }

    setupEventListeners() {
        // Modal close buttons
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

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });
    }

    async loadTeamMembers() {
        const loadingEl = document.getElementById('team-loading');
        const gridEl = document.getElementById('team-grid');

        try {
            loadingEl.style.display = 'block';
            gridEl.style.display = 'none';

            // Try API first, fallback to local data
            try {
                const response = await fetch('/api/team');
                if (response.ok) {
                    this.teamMembers = await response.json();
                } else {
                    throw new Error('API not available');
                }
            } catch (apiError) {
                console.log('API not available, loading local data...');
                this.teamMembers = await this.loadLocalTeam();
            }

            this.renderTeamMembers();

            loadingEl.style.display = 'none';
            gridEl.style.display = 'grid';
        } catch (error) {
            console.error('Error loading team members:', error);
            this.showError('Failed to load team members. Please try again later.');
        }
    }

    async loadLocalTeam() {
        const response = await fetch('data/team.json');
        const data = await response.json();
        return data.teamMembers;
    }

    renderTeamMembers() {
        const gridEl = document.getElementById('team-grid');
        gridEl.innerHTML = this.teamMembers.map(member => this.createTeamCard(member)).join('');

        gridEl.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', () => {
                const memberId = card.dataset.memberId;
                this.showTeamMemberDetails(memberId);
            });

            // Keyboard accessibility
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const memberId = card.dataset.memberId;
                    this.showTeamMemberDetails(memberId);
                }
            });
        });
    }

    createTeamCard(member) {
        return `
            <div class="team-card" data-member-id="${member.id}" tabindex="0" role="button" aria-pressed="false">
                <img src="${member.image}" alt="${member.name}" class="team-photo" loading="lazy">
                <h3 class="team-name">${member.name}</h3>
                <p class="team-position">${member.position}</p>
                <p class="team-experience">${member.experience} experience</p>
            </div>
        `;
    }

    showTeamMemberDetails(memberId) {
        const member = this.teamMembers.find(m => m.id === memberId);
        if (!member) return;

        const modalBody = document.getElementById('team-modal-body');
        modalBody.innerHTML = this.createTeamMemberDetailsHTML(member);

        this.openModal('team-member-modal');
    }

    createTeamMemberDetailsHTML(member) {
        return `
            <div class="team-member-details">
                <img src="${member.image}" alt="${member.name}" class="team-photo">
                <h2>${member.name}</h2>
                <h4>${member.position}</h4>
                <p class="experience-badge">${member.experience} Experience</p>
                <p class="education">${member.education}</p>
                <p class="member-bio">${member.bio}</p>
                
                <div class="expertise-section">
                    <h5>Expertise</h5>
                    <div class="team-expertise">
                        ${member.expertise.map(skill => `<span class="expertise-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                
                <div class="achievements-section">
                    <h5>Key Achievements</h5>
                    <ul class="achievements-list">
                        ${member.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="team-contact">
                    <a href="mailto:${member.email}" aria-label="Email ${member.name}">
                        <i class="fas fa-envelope"></i>
                    </a>
                    <a href="${member.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile of ${member.name}">
                        <i class="fab fa-linkedin"></i>
                    </a>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="window.location.href='index.html#contact'">Contact Us</button>
                </div>
            </div>
        `;
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

    showError(message) {
        const loadingEl = document.getElementById('team-loading');
        loadingEl.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Team Members</h3>
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

// Initialize team page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TeamPage();
});
