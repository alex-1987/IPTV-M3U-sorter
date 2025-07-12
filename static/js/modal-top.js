// Success Modal Functions - Top Positioning
function showSuccessModal(title, message, url = null) {
    // Remove existing modals
    const existingModal = document.querySelector('.success-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="success-modal">
            <h3>${title}</h3>
            <p>${message}</p>
            ${url ? `
                <div class="url-container">
                    <strong>URL:</strong><br>
                    <span id="playlist-url">${url}</span>
                </div>
                <div class="button-group">
                    <button class="copy-btn" onclick="copyToClipboard('${url}')">
                        📋 Kopieren
                    </button>
                    <button class="copy-btn" onclick="openInNewTab('${url}')">
                        🔗 Öffnen
                    </button>
                    <button class="close-btn" onclick="closeSuccessModal()">
                        ✖ Schließen
                    </button>
                </div>
            ` : `
                <div class="button-group">
                    <button class="close-btn" onclick="closeSuccessModal()">
                        ✖ Schließen
                    </button>
                </div>
            `}
        </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Auto-close after 10 seconds if no URL (simple success)
    if (!url) {
        setTimeout(() => {
            closeSuccessModal();
        }, 5000);
    }
}

function closeSuccessModal() {
    const modal = document.querySelector('.success-modal');
    if (modal) {
        modal.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('URL in die Zwischenablage kopiert!', 'success');
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('URL in die Zwischenablage kopiert!', 'success');
    });
}

function openInNewTab(url) {
    window.open(url, '_blank');
}

function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to container
    container.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showErrorModal(title, message) {
    // Remove existing modals
    const existingModal = document.querySelector('.error-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create error modal HTML
    const modalHTML = `
        <div class="error-modal">
            <h3>❌ ${title}</h3>
            <p>${message}</p>
            <div class="button-group">
                <button class="close-btn" onclick="closeErrorModal()">
                    ✖ Schließen
                </button>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Auto-close after 8 seconds
    setTimeout(() => {
        closeErrorModal();
    }, 8000);
}

function closeErrorModal() {
    const modal = document.querySelector('.error-modal');
    if (modal) {
        modal.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Add slide up animation to CSS
const slideUpCSS = `
@keyframes slideUp {
    from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    to {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = slideUpCSS;
document.head.appendChild(style);