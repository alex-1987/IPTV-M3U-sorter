// Channel Management - Delete Functionality
class ChannelManager {
    constructor(sorter) {
        this.sorter = sorter;
        this.selectedChannels = new Set();
        this.selectMode = false;
        this.init();
    }

    init() {
        // Show channel actions when channels are loaded
        this.updateChannelActionsVisibility();
    }

    updateChannelActionsVisibility() {
        const channelActions = document.getElementById('channelActions');
        const hasChannels = this.sorter.channels && this.sorter.channels.length > 0;
        
        if (channelActions) {
            channelActions.style.display = hasChannels ? 'flex' : 'none';
        }
    }

    enableSelectMode() {
        this.selectMode = true;
        this.addCheckboxesToChannels();
        this.updateUI();
    }

    disableSelectMode() {
        this.selectMode = false;
        this.selectedChannels.clear();
        this.removeCheckboxesFromChannels();
        this.updateUI();
    }

    addCheckboxesToChannels() {
        const channelItems = document.querySelectorAll('.channel-item');
        
        channelItems.forEach((item, index) => {
            // Add selectable class
            item.classList.add('selectable');
            
            // Check if checkbox already exists
            if (!item.querySelector('.channel-checkbox')) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'channel-checkbox';
                checkbox.dataset.channelIndex = index;
                
                checkbox.addEventListener('change', (e) => {
                    this.handleChannelSelection(index, e.target.checked);
                });
                
                item.insertBefore(checkbox, item.firstChild);
            }
        });
    }

    removeCheckboxesFromChannels() {
        const channelItems = document.querySelectorAll('.channel-item');
        
        channelItems.forEach(item => {
            item.classList.remove('selectable', 'selected');
            const checkbox = item.querySelector('.channel-checkbox');
            if (checkbox) {
                checkbox.remove();
            }
        });
    }

    handleChannelSelection(channelIndex, isSelected) {
        const channelItem = document.querySelector(`[data-channel-index="${channelIndex}"]`)?.closest('.channel-item');
        
        if (isSelected) {
            this.selectedChannels.add(channelIndex);
            channelItem?.classList.add('selected');
        } else {
            this.selectedChannels.delete(channelIndex);
            channelItem?.classList.remove('selected');
        }
        
        this.updateUI();
    }

    updateUI() {
        const selectedCount = document.getElementById('selectedCount');
        const deleteBtn = document.getElementById('deleteBtn');
        const selectAllBtn = document.getElementById('selectAllBtn');
        
        if (selectedCount) {
            selectedCount.textContent = `${this.selectedChannels.size} ausgewählt`;
        }
        
        if (deleteBtn) {
            deleteBtn.disabled = this.selectedChannels.size === 0;
        }
        
        // Update select all button
        if (selectAllBtn) {
            const allSelected = this.selectedChannels.size === this.sorter.channels.length;
            const icon = selectAllBtn.querySelector('i');
            
            if (allSelected) {
                selectAllBtn.innerHTML = '<i class="fas fa-square"></i> Alle abwählen';
            } else {
                selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Alle auswählen';
            }
        }
    }

    toggleSelectAll() {
        const allSelected = this.selectedChannels.size === this.sorter.channels.length;
        
        if (allSelected) {
            // Deselect all
            this.clearSelection();
        } else {
            // Select all
            this.selectAll();
        }
    }

    selectAll() {
        const checkboxes = document.querySelectorAll('.channel-checkbox');
        
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = true;
            this.selectedChannels.add(index);
            checkbox.closest('.channel-item')?.classList.add('selected');
        });
        
        this.updateUI();
    }

    clearSelection() {
        const checkboxes = document.querySelectorAll('.channel-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.channel-item')?.classList.remove('selected');
        });
        
        this.selectedChannels.clear();
        this.updateUI();
    }

    deleteSelectedChannels() {
        if (this.selectedChannels.size === 0) return;
        
        const selectedChannelNames = Array.from(this.selectedChannels)
            .map(index => this.sorter.channels[index]?.name || `Channel ${index + 1}`)
            .slice(0, 10); // Show max 10 names in preview
        
        this.showDeleteConfirmation(selectedChannelNames);
    }

    showDeleteConfirmation(channelNames) {
        const modal = document.createElement('div');
        modal.className = 'delete-modal';
        
        const hasMore = this.selectedChannels.size > 10;
        const previewList = channelNames.map(name => 
            `<div class="channel-preview-item">• ${this.escapeHtml(name)}</div>`
        ).join('');
        
        modal.innerHTML = `
            <div class="delete-modal-content">
                <div class="delete-modal-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Channels löschen</h3>
                </div>
                <div class="delete-modal-body">
                    <p><strong>Sind Sie sicher, dass Sie ${this.selectedChannels.size} Channel(s) löschen möchten?</strong></p>
                    <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
                    
                    <div class="channel-preview">
                        ${previewList}
                        ${hasMore ? `<div class="channel-preview-item"><strong>... und ${this.selectedChannels.size - 10} weitere</strong></div>` : ''}
                    </div>
                </div>
                <div class="delete-modal-actions">
                    <button class="btn-cancel" onclick="this.closest('.delete-modal').remove()">
                        <i class="fas fa-times"></i> Abbrechen
                    </button>
                    <button class="btn-confirm-delete" onclick="channelManager.confirmDelete(); this.closest('.delete-modal').remove()">
                        <i class="fas fa-trash"></i> Löschen
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    confirmDelete() {
        // Convert Set to Array and sort in descending order to maintain correct indices
        const indicesToDelete = Array.from(this.selectedChannels).sort((a, b) => b - a);
        
        // Remove channels from the main array
        indicesToDelete.forEach(index => {
            this.sorter.channels.splice(index, 1);
        });
        
        // Update channel numbers
        this.sorter.channels.forEach((channel, index) => {
            channel.channelNumber = index + 1;
        });
        
        // Clear selection and re-render
        this.selectedChannels.clear();
        this.sorter.renderChannels();
        this.updateChannelActionsVisibility();
        
        // Show success message
        this.sorter.showMessage(
            `${indicesToDelete.length} Channel(s) erfolgreich gelöscht.`, 
            'success'
        );
        
        // Update stats
        this.sorter.updateStats();
        
        // Re-enable select mode if it was active
        if (this.selectMode) {
            setTimeout(() => {
                this.addCheckboxesToChannels();
                this.updateUI();
            }, 100);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for the UI
let channelManager;

function toggleSelectAll() {
    if (!channelManager.selectMode) {
        channelManager.enableSelectMode();
    }
    channelManager.toggleSelectAll();
}

function deleteSelectedChannels() {
    if (!channelManager.selectMode) {
        channelManager.enableSelectMode();
        return;
    }
    channelManager.deleteSelectedChannels();
}

function clearSelection() {
    channelManager.disableSelectMode();
}

// Initialize channel manager when sorter is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the main sorter to be initialized
    const checkSorter = setInterval(() => {
        if (window.sorter && window.sorter.channels) {
            channelManager = new ChannelManager(window.sorter);
            clearInterval(checkSorter);
        }
    }, 100);
});
