// Updated Save Online Function with Top Modal
async function saveOnline() {
    if (!currentChannels || currentChannels.length === 0) {
        showErrorModal('Fehler', 'Keine Kanäle zum Speichern vorhanden. Bitte laden Sie zuerst eine M3U Datei hoch.');
        return;
    }

    // Show input modal for playlist name
    const playlistName = await showPlaylistNameInput();
    if (!playlistName) {
        return; // User cancelled
    }

    // Show loading
    showLoading('Speichere Playlist online...');

    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channels: currentChannels,
                name: playlistName,
                replace_existing: false
            })
        });

        const result = await response.json();
        hideLoading();

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
        hideLoading();
        showErrorModal('Netzwerk-Fehler', 'Fehler beim Speichern der Playlist: ' + error.message);
    }
}

async function savePlaylistWithReplace(playlistName) {
    showLoading('Ersetze bestehende Playlist...');

    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channels: currentChannels,
                name: playlistName,
                replace_existing: true
            })
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            showSuccessModal(
                '✅ Playlist erfolgreich ersetzt!',
                'Ihre Playlist wurde aktualisiert und ist online verfügbar:',
                result.url
            );
            showToast(`Playlist "${playlistName}" erfolgreich ersetzt!`, 'success');
        } else {
            showErrorModal('Fehler beim Ersetzen', result.error);
        }
    } catch (error) {
        hideLoading();
        showErrorModal('Netzwerk-Fehler', 'Fehler beim Ersetzen der Playlist: ' + error.message);
    }
}

function showPlaylistNameInput() {
    return new Promise((resolve) => {
        // Remove existing input modal
        const existing = document.querySelector('.input-modal');
        if (existing) {
            existing.remove();
        }

        const modalHTML = `
            <div class="input-modal">
                <div class="modal-overlay" onclick="closeInputModal(false)"></div>
                <div class="modal-content">
                    <h3>Playlist Namen eingeben</h3>
                    <p>Geben Sie einen Namen für Ihre Online-Playlist ein:</p>
                    <input type="text" id="playlistNameInput" placeholder="Meine IPTV Playlist" maxlength="50">
                    <div class="button-group">
                        <button class="btn btn-primary" onclick="closeInputModal(true)">
                            💾 Speichern
                        </button>
                        <button class="btn btn-secondary" onclick="closeInputModal(false)">
                            ❌ Abbrechen
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus input
        const input = document.getElementById('playlistNameInput');
        input.focus();
        
        // Handle Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                closeInputModal(true);
            }
        });

        // Store resolve function globally so closeInputModal can access it
        window.currentInputResolve = resolve;
    });
}

function closeInputModal(save) {
    const modal = document.querySelector('.input-modal');
    const input = document.getElementById('playlistNameInput');
    let value = null;
    
    if (save && input) {
        value = input.value.trim();
        if (!value) {
            showToast('Bitte geben Sie einen Namen ein!', 'warning');
            return;
        }
    }
    
    if (modal) {
        modal.remove();
    }
    
    if (window.currentInputResolve) {
        window.currentInputResolve(value);
        window.currentInputResolve = null;
    }
}

function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const existing = document.querySelector('.confirm-modal');
        if (existing) {
            existing.remove();
        }

        const modalHTML = `
            <div class="confirm-modal">
                <div class="modal-overlay" onclick="closeConfirmModal(false)"></div>
                <div class="modal-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="button-group">
                        <button class="btn btn-primary" onclick="closeConfirmModal(true)">
                            ✅ Ja, ersetzen
                        </button>
                        <button class="btn btn-secondary" onclick="closeConfirmModal(false)">
                            ❌ Abbrechen
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        window.currentConfirmResolve = resolve;
    });
}

function closeConfirmModal(confirmed) {
    const modal = document.querySelector('.confirm-modal');
    if (modal) {
        modal.remove();
    }
    
    if (window.currentConfirmResolve) {
        window.currentConfirmResolve(confirmed);
        window.currentConfirmResolve = null;
    }
}

// Add CSS for input and confirm modals
const modalCSS = `
.input-modal, .confirm-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 50px;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
}

.modal-content {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
    position: relative;
    animation: modalSlideDown 0.3s ease-out;
}

@keyframes modalSlideDown {
    from {
        opacity: 0;
        transform: translateY(-30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-content h3 {
    margin: 0 0 15px 0;
    color: #333;
}

.modal-content p {
    margin: 0 0 15px 0;
    color: #666;
}

.modal-content input {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    margin-bottom: 20px;
    box-sizing: border-box;
}

.modal-content input:focus {
    outline: none;
    border-color: #007bff;
}

.modal-content .button-group {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.modal-content .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.modal-content .btn-primary {
    background: #007bff;
    color: white;
}

.modal-content .btn-secondary {
    background: #6c757d;
    color: white;
}

.modal-content .btn:hover {
    opacity: 0.9;
}
`;

// Inject modal CSS
const modalStyle = document.createElement('style');
modalStyle.textContent = modalCSS;
document.head.appendChild(modalStyle);