// Integration Script - Call this to enable top-positioned modals
function enableTopModals() {
    // Override the existing saveOnline function if it exists
    if (typeof window.saveOnline === 'function') {
        console.log('Upgrading saveOnline function to use top modals');
    }
    
    // Load the top modal functionality
    loadTopModalFunctionality();
    
    console.log('✅ Top-positioned modals enabled');
}

function loadTopModalFunctionality() {
    // This function contains all the top modal code
    // It will override any existing modal functions
    
    // Override showSuccess function to use top positioning
    window.showSuccess = function(title, message, url = null) {
        showSuccessModal(title, message, url);
    };
    
    // Override showError function to use top positioning  
    window.showError = function(title, message) {
        showErrorModal(title, message);
    };
    
    // Make sure the save online function uses top modals
    window.saveOnlineWithTopModal = async function() {
        if (!window.currentChannels || window.currentChannels.length === 0) {
            showErrorModal('Fehler', 'Keine Kanäle zum Speichern vorhanden. Bitte laden Sie zuerst eine M3U Datei hoch.');
            return;
        }

        // Show input modal for playlist name
        const playlistName = await showPlaylistNameInput();
        if (!playlistName) {
            return; // User cancelled
        }

        // Show loading (if function exists)
        if (typeof window.showLoading === 'function') {
            window.showLoading('Speichere Playlist online...');
        }

        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    channels: window.currentChannels,
                    name: playlistName,
                    replace_existing: false
                })
            });

            const result = await response.json();
            
            if (typeof window.hideLoading === 'function') {
                window.hideLoading();
            }

            if (result.success) {
                // Show success modal at top with URL
                showSuccessModal(
                    '✅ Playlist erfolgreich gespeichert!',
                    'Ihre Playlist ist nun online verfügbar:',
                    result.url
                );
                
                // Also show a toast notification
                showToast(`Playlist "${playlistName}" erfolgreich online gespeichert!`, 'success');
            } else {
                if (result.error.includes('bereits vergeben')) {
                    // Ask if user wants to replace
                    const replace = await showConfirmDialog(
                        'Playlist existiert bereits',
                        `Der Name "${playlistName}" ist bereits vergeben. Möchten Sie die bestehende Playlist ersetzen?`
                    );
                    
                    if (replace) {
                        // Retry with replace_existing = true
                        await savePlaylistWithReplace(playlistName);
                    }
                } else {
                    showErrorModal('Fehler beim Speichern', result.error);
                }
            }
        } catch (error) {
            if (typeof window.hideLoading === 'function') {
                window.hideLoading();
            }
            showErrorModal('Netzwerk-Fehler', 'Fehler beim Speichern der Playlist: ' + error.message);
        }
    };
    
    // Replace the original saveOnline function
    window.saveOnline = window.saveOnlineWithTopModal;
}

// Auto-enable when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableTopModals);
} else {
    enableTopModals();
}