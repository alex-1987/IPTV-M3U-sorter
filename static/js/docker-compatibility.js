// Docker Compatibility Enhancement for IPTV M3U Sorter
// This file ensures that delete buttons and status icons work correctly in Docker

document.addEventListener('DOMContentLoaded', function() {
    console.log('Docker compatibility script loaded');
    
    // Enhanced createChannelElement override for Docker compatibility
    setTimeout(() => {
        if (window.sorter && typeof window.sorter.createChannelElement === 'function') {
            const originalCreateChannelElement = window.sorter.createChannelElement;
            
            window.sorter.createChannelElement = function(channel, index) {
                const element = originalCreateChannelElement.call(this, channel, index);
                
                // Ensure delete button and status indicator are present
                if (!element.querySelector('.btn-delete-single')) {
                    // Create inline actions container if not exists
                    let inlineActions = element.querySelector('.channel-actions-inline');
                    if (!inlineActions) {
                        inlineActions = document.createElement('div');
                        inlineActions.className = 'channel-actions-inline';
                        element.appendChild(inlineActions);
                    }
                    
                    // Add status indicator if not exists
                    if (!inlineActions.querySelector('.channel-status-indicator')) {
                        const statusIndicator = document.createElement('div');
                        statusIndicator.className = 'channel-status-indicator';
                        statusIndicator.id = `status-${index}`;
                        inlineActions.appendChild(statusIndicator);
                    }
                    
                    // Add delete button if not exists
                    if (!inlineActions.querySelector('.btn-delete-single')) {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn-delete-single';
                        deleteBtn.title = 'Kanal löschen';
                        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                        deleteBtn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (typeof deleteSingleChannel === 'function') {
                                deleteSingleChannel(index);
                            } else {
                                console.error('deleteSingleChannel function not found');
                            }
                        };
                        inlineActions.appendChild(deleteBtn);
                    }
                }
                
                return element;
            };
            
            console.log('Enhanced createChannelElement for Docker compatibility');
        }
    }, 1000);
    
    // Backup CSS injection for critical styles
    function ensureCriticalStyles() {
        if (!document.querySelector('#docker-compatibility-styles')) {
            const additionalCSS = document.createElement('style');
            additionalCSS.id = 'docker-compatibility-styles';
            additionalCSS.textContent = `
                /* Critical styles for Docker compatibility */
                .btn-delete-single {
                    background: #dc3545 !important;
                    color: white !important;
                    border: none !important;
                    padding: 6px 8px !important;
                    border-radius: 4px !important;
                    cursor: pointer !important;
                    font-size: 12px !important;
                    transition: all 0.2s ease !important;
                    opacity: 1 !important;
                    transform: scale(1) !important;
                    position: relative !important;
                    z-index: 11 !important;
                    display: inline-block !important;
                }
                
                .btn-delete-single:hover {
                    background: #c82333 !important;
                }
                
                .channel-actions-inline {
                    display: flex !important;
                    align-items: center !important;
                    margin-right: 10px !important;
                    position: relative !important;
                    z-index: 10 !important;
                }
                
                .channel-status-indicator {
                    display: inline-flex !important;
                    align-items: center !important;
                    margin-left: 8px !important;
                    margin-right: 5px !important;
                }
                
                .status-icon {
                    font-size: 16px !important;
                    padding: 4px !important;
                    border-radius: 4px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    min-width: 24px !important;
                    height: 24px !important;
                    font-weight: bold !important;
                }
                
                .status-online {
                    color: #28a745 !important;
                    background: rgba(40, 167, 69, 0.2) !important;
                    border: 1px solid rgba(40, 167, 69, 0.3) !important;
                }
                
                .status-offline {
                    color: #dc3545 !important;
                    background: rgba(220, 53, 69, 0.2) !important;
                    border: 1px solid rgba(220, 53, 69, 0.3) !important;
                }
                
                .status-checking {
                    color: #ffc107 !important;
                    background: rgba(255, 193, 7, 0.2) !important;
                    border: 1px solid rgba(255, 193, 7, 0.3) !important;
                    animation: pulse 1.5s infinite !important;
                }
            `;
            document.head.appendChild(additionalCSS);
            console.log('Critical compatibility styles injected');
        }
    }
    
    // Check if external CSS loaded, if not inject backup styles
    setTimeout(ensureCriticalStyles, 500);
});
