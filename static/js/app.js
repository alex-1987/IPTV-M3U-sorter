// IPTV M3U Sorter - Frontend JavaScript
class M3USorter {
    constructor() {
        this.channels = [];
        this.filteredChannels = [];
        this.draggedElement = null;
        this.currentPlaylistId = null;
        this.templates = this.loadTemplates();
        
        this.initializeEventListeners();
        this.setupDragAndDrop();
        this.loadSavedPlaylists();
    }

    initializeEventListeners() {
        // File upload - using the actual HTML element IDs
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }

        // Drag and drop for upload area
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
            uploadArea.addEventListener('dragenter', () => uploadArea.classList.add('drag-over'));
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
        }

        // Search and filter (these may not exist initially)
        this.setupSearchAndFilter();

        // Global functions for buttons in HTML
        window.exportPlaylist = () => this.exportPlaylist();
        window.savePlaylist = () => this.savePlaylist();
        window.resetPlaylist = () => this.resetPlaylist();
    }

    setupSearchAndFilter() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterChannels());
        }
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterChannels());
        }
    }

    setupDragAndDrop() {
        // This will be called when channels are loaded
    }

    handleFileSelection(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    handleFileDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    async processFile(file) {
        if (!file.name.toLowerCase().endsWith('.m3u')) {
            this.showMessage('Bitte wählen Sie eine gültige M3U-Datei aus.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            this.showLoadingState();
            this.showMessage('M3U-Datei wird hochgeladen und verarbeitet...', 'info');
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Server response:', result); // Debug

            if (result.success) {
                console.log('Success! Channels count:', result.channels.length); // Debug
                this.channels = result.channels;
                
                // Initialize channel numbers
                this.updateChannelNumbers();
                
                this.filteredChannels = [...this.channels];
                
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    this.showPlaylistSection();
                    this.populateCategories();
                    this.renderChannels();
                    this.updateStats();
                }, 100);
                
                this.showMessage(`${this.channels.length} Kanäle erfolgreich geladen.`, 'success');
            } else {
                this.showMessage(result.error || 'Fehler beim Verarbeiten der M3U-Datei.', 'error');
                this.hideLoadingState();
            }
        } catch (error) {
            this.showMessage('Fehler beim Hochladen: ' + error.message, 'error');
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        const uploadSection = document.getElementById('uploadSection');
        const loadingSection = document.getElementById('loadingSection');
        
        if (uploadSection) uploadSection.style.display = 'none';
        if (loadingSection) loadingSection.style.display = 'block';
    }

    hideLoadingState() {
        const uploadSection = document.getElementById('uploadSection');
        const loadingSection = document.getElementById('loadingSection');
        
        if (loadingSection) loadingSection.style.display = 'none';
        if (uploadSection) uploadSection.style.display = 'block';
    }

    showPlaylistSection() {
        console.log('showPlaylistSection called'); // Debug
        const uploadSection = document.getElementById('uploadSection');
        const loadingSection = document.getElementById('loadingSection');
        const playlistSection = document.getElementById('playlistSection');
        
        console.log('Elements found:', {
            uploadSection: !!uploadSection,
            loadingSection: !!loadingSection,
            playlistSection: !!playlistSection
        }); // Debug
        
        if (uploadSection) uploadSection.style.display = 'none';
        if (loadingSection) loadingSection.style.display = 'none';
        if (playlistSection) {
            playlistSection.style.display = 'block';
            // Template selector is now integrated in playlist section
            this.updateTemplateSelector();
        }
        
        console.log('Sections switched - template is now integrated in playlist section'); // Debug
    }

    populateCategories() {
        const categories = new Set(['Alle Kategorien']);
        this.channels.forEach(channel => {
            if (channel.group) {
                categories.add(channel.group);
            }
        });

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category === 'Alle Kategorien' ? '' : category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
    }

    filterChannels() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';

        this.filteredChannels = this.channels.filter(channel => {
            const matchesSearch = !searchTerm || 
                channel.name.toLowerCase().includes(searchTerm) ||
                (channel.group && channel.group.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !selectedCategory || channel.group === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });

        this.renderChannels();
        this.updateStats();
    }

    renderChannels() {
        const channelsList = document.getElementById('channelsList');
        if (!channelsList) return;

        channelsList.innerHTML = '';

        if (this.filteredChannels.length === 0) {
            channelsList.innerHTML = '<div class="no-channels">Keine Kanäle anzuzeigen</div>';
            return;
        }

        // Show filter info if filters are active
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const isFiltered = (searchInput && searchInput.value.trim()) || 
                          (categoryFilter && categoryFilter.value);
        
        if (isFiltered && this.filteredChannels.length !== this.channels.length) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'filter-info';
            infoDiv.innerHTML = `ℹ️ Gefilterte Ansicht: ${this.filteredChannels.length} von ${this.channels.length} Kanälen. Nummern zeigen die echten Positionen in der Hauptliste. Eingabe bezieht sich auf Hauptlisten-Position.`;
            channelsList.appendChild(infoDiv);
        }

        // Render each channel with correct sequential numbering
        this.filteredChannels.forEach((channel, index) => {
            const channelDiv = this.createChannelElement(channel, index);
            channelsList.appendChild(channelDiv);
        });
        
        // Update channel manager visibility when channels are rendered
        if (window.channelManager) {
            window.channelManager.updateChannelActionsVisibility();
        }
        
        console.log('Rendered channels:', this.filteredChannels.map((ch, idx) => ({
            name: ch.name,
            displayPosition: idx + 1,
            channelNumber: ch.channelNumber
        })));
    }

    updateStats() {
        const totalChannelsEl = document.getElementById('totalChannels');
        const totalGroupsEl = document.getElementById('totalGroups');
        
        if (totalChannelsEl) {
            const showing = this.filteredChannels.length;
            const total = this.channels.length;
            totalChannelsEl.textContent = showing === total ? 
                `${total} Kanäle` : 
                `${showing} von ${total} Kanälen`;
        }
        
        if (totalGroupsEl) {
            const groups = new Set();
            this.channels.forEach(channel => {
                if (channel.group) groups.add(channel.group);
            });
            totalGroupsEl.textContent = `${groups.size} Gruppen`;
        }
    }

    createChannelElement(channel, index) {
        const div = document.createElement('div');
        div.className = 'channel-item';
        div.draggable = true;
        div.dataset.index = index;

        // Calculate channel number (1-based)
        const channelNumber = this.getChannelNumber(channel, index);

        // Escape HTML to prevent XSS and rendering issues
        const escapedName = this.escapeHtml(channel.name);
        const escapedGroup = channel.group ? this.escapeHtml(channel.group) : '';

        div.innerHTML = `
            <div class="channel-number" title="Klicken zum Bearbeiten">
                ${channelNumber}
            </div>
            <div class="channel-info">
                <div class="channel-name">${escapedName}</div>
                <div class="channel-details">
                    ${channel.group ? `<span class="channel-group">${escapedGroup}</span>` : ''}
                    ${channel.logo ? `<img src="${channel.logo}" alt="Logo" class="channel-logo" onerror="this.style.display='none'">` : ''}
                </div>
            </div>
            <div class="channel-actions-inline">
                <button class="btn-delete-single" title="Kanal löschen" onclick="deleteSingleChannel(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="drag-handle">⋮⋮</div>
        `;

        // Add click handler to channel number for editing
        const numberElement = div.querySelector('.channel-number');
        if (numberElement) {
            numberElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Channel number clicked:', { channel: channel.name, index, number: channelNumber });
                editChannelNumber(numberElement, index);
            });
        }

        // Add drag and drop event listeners
        div.addEventListener('dragstart', (e) => this.handleDragStart(e));
        div.addEventListener('dragover', (e) => this.handleChannelDragOver(e));
        div.addEventListener('drop', (e) => this.handleChannelDrop(e));
        div.addEventListener('dragend', (e) => this.handleDragEnd(e));

        return div;
    }

    getChannelNumber(channel, index) {
        // Always use the channel's actual position in the main array, not the filtered position
        return channel.channelNumber || (this.channels.indexOf(channel) + 1);
    }

    async moveChannelToPosition(fromIndex, toPosition) {
        if (toPosition < 1) {
            this.showMessage('Ungültige Kanalnummer. Geben Sie eine Nummer größer als 0 ein.', 'error');
            return;
        }

        if (toPosition > this.channels.length) {
            this.showMessage(`Ungültige Kanalnummer. Geben Sie eine Nummer zwischen 1 und ${this.channels.length} ein.`, 'error');
            return;
        }

        // Check if we're in filtered mode
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const isFiltered = (searchInput && searchInput.value.trim()) || 
                          (categoryFilter && categoryFilter.value);
        
        if (isFiltered) {
            // In filtered mode, toPosition refers to MAIN list position, not filtered position
            await this.moveFilteredChannelToMainPosition(fromIndex, toPosition);
        } else {
            // In full mode, work with all channels
            await this.moveFullChannelToPosition(fromIndex, toPosition);
        }
    }

    async moveFilteredChannelToMainPosition(fromIndex, toPosition) {
        console.log('=== MOVE TO MAIN POSITION FROM FILTERED VIEW ===');
        
        const movedChannel = this.filteredChannels[fromIndex];
        const targetIndex = toPosition - 1; // Convert to 0-based index
        
        console.log(`Moving ${movedChannel.name} from filtered index ${fromIndex} to MAIN position ${toPosition}`);
        
        // Check if target position is occupied
        const targetChannel = this.channels[targetIndex];
        
        if (targetChannel) {
            // Target position is occupied - ask user what to do
            const action = await this.askUserAction(toPosition, targetChannel.name);
            
            switch (action) {
                case 'replace':
                    await this.replaceChannelInMainPosition(movedChannel, targetChannel, toPosition);
                    break;
                    
                case 'swap':
                    await this.swapChannelsInMainPosition(movedChannel, targetChannel);
                    break;
                    
                case 'shift':
                    await this.shiftChannelToMainPosition(movedChannel, toPosition);
                    break;
                    
                case 'cancel':
                    return;
            }
        } else {
            // Target position is free - simple move
            await this.shiftChannelToMainPosition(movedChannel, toPosition);
        }
        
        // Update channel numbers and refresh view
        this.updateChannelNumbers();
        this.filterChannels(); // Re-apply filters to refresh the filtered view
        
        console.log(`Successfully moved ${movedChannel.name} to main position ${movedChannel.channelNumber}`);
    }

    async replaceChannelInMainPosition(movedChannel, targetChannel, toPosition) {
        console.log(`Replacing ${targetChannel.name} with ${movedChannel.name} at position ${toPosition}`);
        
        // Find positions in main array
        const movedMainIndex = this.channels.findIndex(ch => 
            ch.name === movedChannel.name && ch.url === movedChannel.url
        );
        const targetMainIndex = this.channels.findIndex(ch => 
            ch.name === targetChannel.name && ch.url === targetChannel.url
        );
        
        if (movedMainIndex === -1 || targetMainIndex === -1) return;
        
        // Remove target channel completely
        this.channels.splice(targetMainIndex, 1);
        
        // Adjust moved channel index if needed
        let adjustedMovedIndex = movedMainIndex;
        if (targetMainIndex < movedMainIndex) {
            adjustedMovedIndex = movedMainIndex - 1;
        }
        
        // Remove moved channel from its current position
        this.channels.splice(adjustedMovedIndex, 1);
        
        // Insert moved channel at target position
        let finalTargetIndex = targetMainIndex;
        if (targetMainIndex > movedMainIndex) {
            finalTargetIndex = targetMainIndex - 1;
        }
        
        this.channels.splice(finalTargetIndex, 0, movedChannel);
        
        this.showMessage(`${targetChannel.name} wurde durch ${movedChannel.name} ersetzt.`, 'success');
    }

    async swapChannelsInMainPosition(movedChannel, targetChannel) {
        console.log(`Swapping ${movedChannel.name} with ${targetChannel.name}`);
        
        // Find positions in main array
        const movedMainIndex = this.channels.findIndex(ch => 
            ch.name === movedChannel.name && ch.url === movedChannel.url
        );
        const targetMainIndex = this.channels.findIndex(ch => 
            ch.name === targetChannel.name && ch.url === targetChannel.url
        );
        
        if (movedMainIndex === -1 || targetMainIndex === -1) return;
        
        // Simple swap
        [this.channels[movedMainIndex], this.channels[targetMainIndex]] = 
        [this.channels[targetMainIndex], this.channels[movedMainIndex]];
        
        this.showMessage(`${movedChannel.name} und ${targetChannel.name} wurden getauscht.`, 'success');
    }

    async shiftChannelToMainPosition(movedChannel, toPosition) {
        console.log(`Shifting ${movedChannel.name} to main position ${toPosition}`);
        
        // Find current position in main array
        const currentMainIndex = this.channels.findIndex(ch => 
            ch.name === movedChannel.name && ch.url === movedChannel.url
        );
        
        if (currentMainIndex === -1) return;
        
        const targetIndex = toPosition - 1;
        
        // Remove from current position
        this.channels.splice(currentMainIndex, 1);
        
        // Adjust target index if we removed something before it
        let adjustedTargetIndex = targetIndex;
        if (currentMainIndex < targetIndex) {
            adjustedTargetIndex = targetIndex - 1;
        }
        
        // Insert at target position
        this.channels.splice(adjustedTargetIndex, 0, movedChannel);
        
        this.showMessage(`${movedChannel.name} zu Hauptlisten-Position ${toPosition} verschoben.`, 'success');
    }

    applySimpleDragToMainArrayFromManualEdit(movedChannel, oldFilteredPos, newFilteredPos, originalFilteredChannels) {
        console.log('=== MANUAL EDIT DRAG LOGIC ===');
        console.log(`Moving ${movedChannel.name} from filtered pos ${oldFilteredPos} to ${newFilteredPos}`);
        console.log('Original filtered channels:', originalFilteredChannels.map(ch => ch.name));
        
        // 1. Remove the moved channel from main array
        const mainIndex = this.channels.findIndex(ch => 
            ch.name === movedChannel.name && ch.url === movedChannel.url
        );
        
        if (mainIndex === -1) return;
        
        console.log(`Removing ${movedChannel.name} from main position ${mainIndex + 1}`);
        this.channels.splice(mainIndex, 1);
        
        // 2. Find where to insert in main array based on new filtered position
        let targetMainIndex = 0;
        
        if (newFilteredPos === 0) {
            // Moving to first position in filtered view
            // Insert before the next visible channel in main array
            const nextVisibleChannel = originalFilteredChannels[1]; // Use original array
            if (nextVisibleChannel && nextVisibleChannel.name !== movedChannel.name) {
                const nextMainIndex = this.channels.findIndex(ch => 
                    ch.name === nextVisibleChannel.name && ch.url === nextVisibleChannel.url
                );
                targetMainIndex = nextMainIndex !== -1 ? nextMainIndex : 0;
                console.log(`Inserting before ${nextVisibleChannel.name} at main position ${targetMainIndex + 1}`);
            } else {
                console.log('No next channel found, inserting at position 1');
            }
        } else {
            // Moving after another channel in filtered view
            // Find the channel that should be before the moved channel
            const prevVisibleChannel = this.filteredChannels[newFilteredPos - 1]; // Use updated array for previous channel
            if (prevVisibleChannel) {
                const prevMainIndex = this.channels.findIndex(ch => 
                    ch.name === prevVisibleChannel.name && ch.url === prevVisibleChannel.url
                );
                targetMainIndex = prevMainIndex !== -1 ? prevMainIndex + 1 : this.channels.length;
                console.log(`Inserting after ${prevVisibleChannel.name} at main position ${targetMainIndex + 1}`);
            }
        }
        
        // 3. Insert at target position
        console.log(`Final insertion: ${movedChannel.name} at main position ${targetMainIndex + 1}`);
        this.channels.splice(targetMainIndex, 0, movedChannel);
        
        console.log('Final main array (first 10):', this.channels.slice(0, 10).map((ch, idx) => `${idx + 1}(${ch.name})`));
    }

    moveChannelToTargetPosition(channelToMove, fromFilteredIndex, toFilteredIndex) {
        // Find positions in main array
        const currentMainIndex = this.channels.findIndex(ch => 
            ch.name === channelToMove.name && ch.url === channelToMove.url
        );
        
        if (currentMainIndex === -1) return;
        
        // Calculate target position in main array
        let targetMainIndex;
        
        if (toFilteredIndex === 0) {
            // Moving to first position in filtered view
            const nextFilteredChannel = this.filteredChannels.find(ch => 
                ch.name !== channelToMove.name || ch.url !== channelToMove.url
            );
            
            if (nextFilteredChannel) {
                const nextMainIndex = this.channels.findIndex(ch => 
                    ch.name === nextFilteredChannel.name && ch.url === nextFilteredChannel.url
                );
                targetMainIndex = nextMainIndex;
            } else {
                targetMainIndex = 0;
            }
        } else {
            // Moving after another channel in filtered view
            const prevFilteredChannel = this.filteredChannels[toFilteredIndex - 1];
            if (prevFilteredChannel && (prevFilteredChannel.name !== channelToMove.name || prevFilteredChannel.url !== channelToMove.url)) {
                const prevMainIndex = this.channels.findIndex(ch => 
                    ch.name === prevFilteredChannel.name && ch.url === prevFilteredChannel.url
                );
                targetMainIndex = prevMainIndex + 1;
            } else {
                targetMainIndex = currentMainIndex; // No change
            }
        }
        
        // Remove from current position
        this.channels.splice(currentMainIndex, 1);
        
        // Adjust target index if needed
        if (targetMainIndex > currentMainIndex) {
            targetMainIndex--;
        }
        
        // Insert at new position
        this.channels.splice(targetMainIndex, 0, channelToMove);
        
        // Update filtered array
        this.filteredChannels.splice(fromFilteredIndex, 1);
        this.filteredChannels.splice(toFilteredIndex, 0, channelToMove);
        
        console.log('Channel moved:', {
            channel: channelToMove.name,
            fromMain: currentMainIndex + 1,
            toMain: targetMainIndex + 1
        });
    }

    moveChannelInBothArraysSimple(channelToMove, fromFilteredIndex, toFilteredIndex) {
        console.log('Moving channel in filtered view:', {
            channel: channelToMove.name,
            fromFiltered: fromFilteredIndex,
            toFiltered: toFilteredIndex,
            currentMainPosition: channelToMove.channelNumber
        });
        
        // Find current position in main array
        const currentMainIndex = this.channels.findIndex(ch => 
            ch.name === channelToMove.name && ch.url === channelToMove.url
        );
        
        if (currentMainIndex === -1) return;
        
        // Calculate target position in main array based on filtered view movement
        let targetMainIndex;
        
        if (toFilteredIndex === 0) {
            // Moving to first position in filtered view
            // Place before the first other visible channel in main array
            const firstOtherFiltered = this.filteredChannels.find(ch => 
                ch.name !== channelToMove.name || ch.url !== channelToMove.url
            );
            
            if (firstOtherFiltered) {
                const firstOtherMainIndex = this.channels.findIndex(ch => 
                    ch.name === firstOtherFiltered.name && ch.url === firstOtherFiltered.url
                );
                targetMainIndex = firstOtherMainIndex;
            } else {
                targetMainIndex = 0;
            }
        } else {
            // Moving after another channel in filtered view
            const targetFilteredChannel = this.filteredChannels[toFilteredIndex];
            const previousFilteredChannel = this.filteredChannels[toFilteredIndex - 1];
            
            if (targetFilteredChannel && (targetFilteredChannel.name !== channelToMove.name || targetFilteredChannel.url !== channelToMove.url)) {
                // We're inserting before this target channel
                const targetMainIndex_temp = this.channels.findIndex(ch => 
                    ch.name === targetFilteredChannel.name && ch.url === targetFilteredChannel.url
                );
                targetMainIndex = targetMainIndex_temp;
            } else if (previousFilteredChannel && (previousFilteredChannel.name !== channelToMove.name || previousFilteredChannel.url !== channelToMove.url)) {
                // We're inserting after the previous channel
                const prevMainIndex = this.channels.findIndex(ch => 
                    ch.name === previousFilteredChannel.name && ch.url === previousFilteredChannel.url
                );
                targetMainIndex = prevMainIndex + 1;
            } else {
                // Fallback
                targetMainIndex = currentMainIndex;
            }
        }
        
        console.log('Calculated positions:', {
            currentMainIndex,
            targetMainIndex,
            willShiftFrom: Math.min(currentMainIndex, targetMainIndex),
            willShiftTo: Math.max(currentMainIndex, targetMainIndex)
        });
        
        // Remove from current position
        this.channels.splice(currentMainIndex, 1);
        
        // Adjust target index if needed (because we removed one element)
        if (targetMainIndex > currentMainIndex) {
            targetMainIndex--;
        }
        
        // Insert at new position
        this.channels.splice(targetMainIndex, 0, channelToMove);
        
        // Update filtered array order
        this.filteredChannels.splice(fromFilteredIndex, 1);
        this.filteredChannels.splice(toFilteredIndex, 0, channelToMove);
        
        console.log('Final result:', {
            newMainPosition: targetMainIndex + 1,
            oldPosition: currentMainIndex + 1,
            channelMoved: channelToMove.name
        });
    }

    async moveFullChannelToPosition(fromIndex, toPosition) {
        const targetIndex = toPosition - 1;
        
        if (targetIndex === fromIndex) return;
        
        const channel = this.channels[fromIndex];
        const targetChannel = this.channels[targetIndex];

        if (targetChannel) {
            const action = await this.askUserAction(toPosition, targetChannel.name);
            
            switch (action) {
                case 'replace':
                    this.channels.splice(targetIndex, 1);
                    if (targetIndex < fromIndex) {
                        this.channels.splice(fromIndex - 1, 1);
                        this.channels.splice(targetIndex, 0, channel);
                    } else {
                        this.channels.splice(fromIndex, 1);
                        this.channels.splice(targetIndex - 1, 0, channel);
                    }
                    break;
                    
                case 'swap':
                    this.channels[fromIndex] = targetChannel;
                    this.channels[targetIndex] = channel;
                    break;
                    
                case 'shift':
                    this.channels.splice(fromIndex, 1);
                    this.channels.splice(targetIndex, 0, channel);
                    break;
                    
                case 'cancel':
                    return;
            }
        } else {
            this.channels.splice(fromIndex, 1);
            this.channels.splice(targetIndex, 0, channel);
        }

        this.updateChannelNumbers();
        this.filteredChannels = [...this.channels];
        this.renderChannels();
        this.showMessage(`Kanal zu Position ${toPosition} verschoben.`, 'success');
    }

    removeChannelFromBothArrays(channelToRemove) {
        // Remove from main array
        const mainIndex = this.channels.findIndex(ch => 
            ch.name === channelToRemove.name && ch.url === channelToRemove.url
        );
        if (mainIndex !== -1) {
            this.channels.splice(mainIndex, 1);
        }
        
        // Remove from filtered array
        const filteredIndex = this.filteredChannels.findIndex(ch => 
            ch.name === channelToRemove.name && ch.url === channelToRemove.url
        );
        if (filteredIndex !== -1) {
            this.filteredChannels.splice(filteredIndex, 1);
        }
    }

    moveChannelInBothArrays(channelToMove, newFilteredIndex) {
        // Find current positions
        const currentMainIndex = this.channels.findIndex(ch => 
            ch.name === channelToMove.name && ch.url === channelToMove.url
        );
        const currentFilteredIndex = this.filteredChannels.findIndex(ch => 
            ch.name === channelToMove.name && ch.url === channelToMove.url
        );
        
        if (currentMainIndex === -1 || currentFilteredIndex === -1) return;
        
        // Remove from current positions
        this.channels.splice(currentMainIndex, 1);
        this.filteredChannels.splice(currentFilteredIndex, 1);
        
        // Calculate new main array position based on filtered position
        let newMainIndex = 0;
        
        if (newFilteredIndex > 0 && newFilteredIndex <= this.filteredChannels.length) {
            // Find the channel that should be before this one in filtered view
            const prevFilteredChannel = this.filteredChannels[newFilteredIndex - 1];
            if (prevFilteredChannel) {
                const prevMainIndex = this.channels.findIndex(ch => 
                    ch.name === prevFilteredChannel.name && ch.url === prevFilteredChannel.url
                );
                newMainIndex = prevMainIndex !== -1 ? prevMainIndex + 1 : newFilteredIndex;
            }
        } else if (newFilteredIndex >= this.filteredChannels.length && this.filteredChannels.length > 0) {
            // Append after last filtered channel
            const lastFilteredChannel = this.filteredChannels[this.filteredChannels.length - 1];
            const lastMainIndex = this.channels.findIndex(ch => 
                ch.name === lastFilteredChannel.name && ch.url === lastFilteredChannel.url
            );
            newMainIndex = lastMainIndex !== -1 ? lastMainIndex + 1 : this.channels.length;
        }
        
        // Insert at new positions
        this.channels.splice(newMainIndex, 0, channelToMove);
        this.filteredChannels.splice(newFilteredIndex, 0, channelToMove);
    }

    swapChannelsInBothArrays(channel1, channel2) {
        // Swap in main array
        const main1Index = this.channels.findIndex(ch => 
            ch.name === channel1.name && ch.url === channel1.url
        );
        const main2Index = this.channels.findIndex(ch => 
            ch.name === channel2.name && ch.url === channel2.url
        );
        
        if (main1Index !== -1 && main2Index !== -1) {
            [this.channels[main1Index], this.channels[main2Index]] = 
            [this.channels[main2Index], this.channels[main1Index]];
        }
        
        // Swap in filtered array
        const filtered1Index = this.filteredChannels.findIndex(ch => 
            ch.name === channel1.name && ch.url === channel1.url
        );
        const filtered2Index = this.filteredChannels.findIndex(ch => 
            ch.name === channel2.name && ch.url === channel2.url
        );
        
        if (filtered1Index !== -1 && filtered2Index !== -1) {
            [this.filteredChannels[filtered1Index], this.filteredChannels[filtered2Index]] = 
            [this.filteredChannels[filtered2Index], this.filteredChannels[filtered1Index]];
        }
    }

    updateChannelNumbers() {
        this.channels.forEach((channel, index) => {
            channel.channelNumber = index + 1;
        });
    }

    async askUserAction(position, existingChannelName) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Position ${position} ist bereits belegt</h3>
                    <p>Kanal "${existingChannelName}" ist bereits auf Position ${position}.</p>
                    <p>Was möchten Sie tun?</p>
                    <div class="modal-actions">
                        <button onclick="resolveAction('replace')" class="btn btn-danger">
                            Ersetzen (Kanal löschen)
                        </button>
                        <button onclick="resolveAction('swap')" class="btn btn-primary">
                            Tauschen
                        </button>
                        <button onclick="resolveAction('shift')" class="btn btn-success">
                            Alle verschieben
                        </button>
                        <button onclick="resolveAction('cancel')" class="btn btn-secondary">
                            Abbrechen
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            window.resolveAction = (action) => {
                document.body.removeChild(modal);
                delete window.resolveAction;
                resolve(action);
            };
        });
    }

    handleDragStart(event) {
        this.draggedElement = event.target.closest('.channel-item');
        this.draggedElement.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        
        // Store original number for restoration if needed
        const numberElement = this.draggedElement.querySelector('.channel-number');
        if (numberElement) {
            this.originalNumber = numberElement.textContent;
        }
    }

    handleChannelDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        if (!this.draggedElement) return;
        
        // Throttle the drag over updates for better performance
        if (this.dragOverTimeout) {
            clearTimeout(this.dragOverTimeout);
        }
        
        this.dragOverTimeout = setTimeout(() => {
            const afterElement = this.getDragAfterElement(event.clientY);
            const channelsList = document.getElementById('channelsList');
            
            // Insert the dragged element at new position
            if (afterElement == null) {
                channelsList.appendChild(this.draggedElement);
            } else {
                channelsList.insertBefore(this.draggedElement, afterElement);
            }
            
            // Update the number preview in real-time
            this.updateDragNumberPreview();
        }, 16); // ~60fps
    }

    updateDragNumberPreview() {
        if (!this.draggedElement) return;
        
        const channelsList = document.getElementById('channelsList');
        const channelElements = channelsList.querySelectorAll('.channel-item:not(.filter-info):not(.filter-warning)');
        const numberElement = this.draggedElement.querySelector('.channel-number');
        
        if (!numberElement) return;
        
        // Find current position in filtered view
        let newFilteredPosition = 1;
        for (let i = 0; i < channelElements.length; i++) {
            if (channelElements[i] === this.draggedElement) {
                newFilteredPosition = i + 1;
                break;
            }
        }
        
        // Check if we're in filtered mode
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const isFiltered = (searchInput && searchInput.value.trim()) || 
                          (categoryFilter && categoryFilter.value);
        
        if (isFiltered) {
            // Calculate the target main position using simple logic
            const targetMainPosition = this.calculateSimpleTargetPosition(newFilteredPosition);
            numberElement.textContent = targetMainPosition;
            this.showDragTooltip(targetMainPosition, true);
        } else {
            // In full mode, show the filtered position (which is the main position)
            numberElement.textContent = newFilteredPosition;
            this.showDragTooltip(newFilteredPosition, false);
        }
        
        numberElement.classList.add('drag-preview');
        
        console.log('Drag preview update:', {
            newFilteredPosition: newFilteredPosition,
            isFiltered: isFiltered,
            draggedChannel: this.draggedElement.querySelector('.channel-name')?.textContent
        });
    }

    calculateSimpleTargetPosition(newFilteredPosition) {
        // Simple approach: find where this would be inserted in the main array
        const draggedChannelName = this.draggedElement.querySelector('.channel-name')?.textContent;
        
        if (newFilteredPosition === 1) {
            // Moving to first position in filtered view
            // Find the next visible channel and insert before it
            const nextFilteredChannel = this.filteredChannels.find(ch => ch.name !== draggedChannelName);
            if (nextFilteredChannel) {
                return nextFilteredChannel.channelNumber;
            }
            return 1;
        } else {
            // Moving after another channel
            // Find the previous visible channel and insert after it
            const prevFilteredChannel = this.filteredChannels[newFilteredPosition - 2]; // -1 for 0-based, -1 for previous
            if (prevFilteredChannel) {
                return prevFilteredChannel.channelNumber + 1;
            }
            return newFilteredPosition;
        }
    }

    showDragTooltip(newPosition, isFiltered) {
        // Remove existing tooltip
        const existingTooltip = document.querySelector('.drag-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // Create new tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'drag-tooltip';
        
        if (isFiltered) {
            tooltip.textContent = `Neue Hauptposition: ${newPosition}`;
        } else {
            tooltip.textContent = `Neue Position: ${newPosition}`;
        }
        
        // Position near the dragged element
        const rect = this.draggedElement.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = (rect.right + 10) + 'px';
        tooltip.style.top = (rect.top + rect.height / 2 - 15) + 'px';
        tooltip.style.zIndex = '10000';
        
        document.body.appendChild(tooltip);
    }

    hideDragTooltip() {
        const tooltip = document.querySelector('.drag-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    handleChannelDrop(event) {
        event.preventDefault();
        
        // Hide tooltip immediately
        this.hideDragTooltip();
        
        // Check if we're in filtered mode
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const isFiltered = (searchInput && searchInput.value.trim()) || 
                          (categoryFilter && categoryFilter.value);
        
        if (isFiltered) {
            this.updateChannelOrderWithFilters();
        } else {
            this.updateChannelOrder();
        }
        
        // Don't show success message here - let the update functions handle it
    }

    handleDragEnd(event) {
        const item = event.target.closest('.channel-item');
        if (item) {
            item.classList.remove('dragging');
            
            // Remove drag preview styling and restore original number
            const numberElement = item.querySelector('.channel-number');
            if (numberElement && this.originalNumber) {
                numberElement.classList.remove('drag-preview');
                // Don't change the number here - let the update functions handle it
            }
        }
        
        // Hide tooltip
        this.hideDragTooltip();
        
        // Clear timeout if exists
        if (this.dragOverTimeout) {
            clearTimeout(this.dragOverTimeout);
            this.dragOverTimeout = null;
        }
        
        // Reset draggedElement
        this.draggedElement = null;
        this.originalNumber = null;
    }

    getDragAfterElement(y) {
        const channelsList = document.getElementById('channelsList');
        const draggableElements = [...channelsList.querySelectorAll('.channel-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateChannelOrder() {
        const channelElements = document.querySelectorAll('.channel-item');
        const newOrder = [];
        
        channelElements.forEach(element => {
            const index = parseInt(element.dataset.index);
            if (!isNaN(index) && this.filteredChannels[index]) {
                newOrder.push(this.filteredChannels[index]);
            }
        });
        
        this.filteredChannels = newOrder;
        
        // Update the main channels array if no filters are applied
        if (this.channels.length === this.filteredChannels.length) {
            this.channels = [...this.filteredChannels];
        }
        
        this.renderChannels();
    }

    async exportPlaylist() {
        if (this.channels.length === 0) {
            this.showMessage('Keine Kanäle zum Exportieren vorhanden.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channels: this.channels })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sorted_playlist.m3u';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showMessage('Playlist erfolgreich exportiert!', 'success');
            } else {
                this.showMessage('Fehler beim Exportieren der Playlist.', 'error');
            }
        } catch (error) {
            this.showMessage('Fehler beim Exportieren: ' + error.message, 'error');
        }
    }

    async savePlaylist() {
        if (this.channels.length === 0) {
            this.showMessage('Keine Kanäle zum Speichern vorhanden.', 'error');
            return;
        }

        const name = prompt('Geben Sie einen Namen für diese Playlist ein:');
        if (!name || !name.trim()) return;

        const cleanName = name.trim();

        try {
            // Try to check if playlist name already exists (if backend supports it)
            let shouldReplace = false;
            try {
                const checkResponse = await fetch(`/api/check_playlist_name/${encodeURIComponent(cleanName)}`);
                if (checkResponse.ok) {
                    const checkResult = await checkResponse.json();
                    if (checkResult.exists) {
                        const replace = confirm(`Eine Playlist mit dem Namen "${cleanName}" existiert bereits.\n\nMöchten Sie sie ersetzen?`);
                        if (!replace) return;
                        shouldReplace = true;
                    }
                }
            } catch (e) {
                // Backend doesn't support name checking yet, continue with save
                console.log('Name checking not supported by backend yet');
            }

            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name: cleanName,
                    channels: this.channels,
                    replace_existing: shouldReplace
                })
            });

            // Check if response is actually JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response. Backend may need to be updated to support named playlists.');
            }

            const result = await response.json();

            if (result.success) {
                this.currentPlaylistId = result.playlist_id;
                
                // Always use the playlist name for the URL with .m3u extension
                // This makes the URLs more user-friendly immediately
                const playlistUrl = `${window.location.origin}/playlist/${encodeURIComponent(cleanName)}.m3u`;
                
                // Show save success info
                this.showSaveSuccess(playlistUrl);
                
                this.showMessage(`Playlist "${cleanName}" erfolgreich gespeichert!`, 'success');
            } else {
                this.showMessage(result.error || 'Fehler beim Speichern der Playlist.', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showMessage('Fehler beim Speichern: ' + error.message, 'error');
        }
    }

    async loadSavedPlaylists() {
        // This could be used to load a list of saved playlists if needed
        // For now, we'll skip this since the current HTML doesn't have a saved playlists section
    }

    // Debug function - can be called from browser console
    debugState() {
        console.log('Current state:', {
            channels: this.channels.length,
            filteredChannels: this.filteredChannels.length,
            uploadSection: document.getElementById('uploadSection')?.style.display,
            loadingSection: document.getElementById('loadingSection')?.style.display,
            playlistSection: document.getElementById('playlistSection')?.style.display
        });
    }

    updateChannelOrder() {
        const channelElements = document.querySelectorAll('.channel-item');
        const newOrder = [];
        
        // Build new order from DOM elements
        channelElements.forEach(element => {
            const index = parseInt(element.dataset.index);
            if (!isNaN(index) && this.filteredChannels[index]) {
                newOrder.push(this.filteredChannels[index]);
            }
        });
        
        // Update both arrays since filtering restrictions are handled in drop handler
        this.filteredChannels = newOrder;
        this.channels = [...this.filteredChannels];
        
        // Update channel numbers and re-render
        this.updateChannelNumbers();
        this.renderChannels();
    }

    updateChannelOrderWithFilters() {
        const channelsList = document.getElementById('channelsList');
        const channelElements = channelsList.querySelectorAll('.channel-item:not(.filter-info):not(.filter-warning)');
        
        // Get the new order from DOM
        const newFilteredOrder = [];
        channelElements.forEach(element => {
            const index = parseInt(element.dataset.index);
            if (!isNaN(index) && this.filteredChannels[index]) {
                newFilteredOrder.push(this.filteredChannels[index]);
            }
        });
        
        console.log('New drag order:', newFilteredOrder.map(ch => ch.name));
        
        // Check if we're in filtered mode
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const isFiltered = (searchInput && searchInput.value.trim()) || 
                          (categoryFilter && categoryFilter.value);
        
        if (isFiltered) {
            // Apply filtered drag to main array
            this.applyFilteredDragToMainArray(newFilteredOrder);
        } else {
            // No filter - simple update
            this.channels = [...newFilteredOrder];
            this.updateChannelNumbers();
        }
        
        this.filteredChannels = newFilteredOrder;
        this.renderChannels();
    }

    applyFilteredDragToMainArray(newFilteredOrder) {
        console.log('=== APPLYING FILTERED DRAG TO MAIN ARRAY ===');
        console.log('Old filtered order:', this.filteredChannels.map(ch => `${ch.name}(${ch.channelNumber})`));
        console.log('New filtered order:', newFilteredOrder.map(ch => `${ch.name}(${ch.channelNumber})`));
        
        // Find what moved (only one channel should move in drag & drop)
        let movedChannel = null;
        let oldPos = -1;
        let newPos = -1;
        
        for (let i = 0; i < newFilteredOrder.length; i++) {
            const newChannel = newFilteredOrder[i];
            const oldChannel = this.filteredChannels[i];
            
            if (!oldChannel || newChannel.name !== oldChannel.name) {
                // Found the moved channel
                movedChannel = newChannel;
                newPos = i;
                oldPos = this.filteredChannels.findIndex(ch => 
                    ch.name === newChannel.name && ch.url === newChannel.url
                );
                break;
            }
        }
        
        if (movedChannel && oldPos !== -1 && newPos !== -1 && oldPos !== newPos) {
            console.log(`Channel moved: ${movedChannel.name} from filtered pos ${oldPos} to ${newPos}`);
            
            // Apply simple drag logic to main array
            this.applySimpleDragToMainArray(movedChannel, oldPos, newPos);
        }
        
        this.updateChannelNumbers();
        this.filteredChannels = newFilteredOrder;
        
        if (movedChannel) {
            this.showMessage(`${movedChannel.name} zu Position ${movedChannel.channelNumber} verschoben.`, 'success');
        }
    }

    applySimpleDragToMainArray(movedChannel, oldFilteredPos, newFilteredPos) {
        console.log('=== SIMPLE DRAG LOGIC ===');
        
        // 1. Remove the moved channel from main array
        const mainIndex = this.channels.findIndex(ch => 
            ch.name === movedChannel.name && ch.url === movedChannel.url
        );
        
        if (mainIndex === -1) return;
        
        console.log(`Removing ${movedChannel.name} from main position ${mainIndex + 1}`);
        this.channels.splice(mainIndex, 1);
        
        // 2. Find where to insert in main array
        let targetMainIndex = 0;
        
        if (newFilteredPos === 0) {
            // Moving to first position in filtered view
            // Insert before the next visible channel in main array
            const nextVisibleChannel = this.filteredChannels[1]; // The channel that will be after the moved one
            if (nextVisibleChannel) {
                const nextMainIndex = this.channels.findIndex(ch => 
                    ch.name === nextVisibleChannel.name && ch.url === nextVisibleChannel.url
                );
                targetMainIndex = nextMainIndex !== -1 ? nextMainIndex : 0;
            }
        } else {
            // Moving after another channel in filtered view
            // Insert after the previous visible channel in main array
            const prevVisibleChannel = this.filteredChannels[newFilteredPos - 1]; // The channel that will be before the moved one
            if (prevVisibleChannel) {
                const prevMainIndex = this.channels.findIndex(ch => 
                    ch.name === prevVisibleChannel.name && ch.url === prevVisibleChannel.url
                );
                targetMainIndex = prevMainIndex !== -1 ? prevMainIndex + 1 : this.channels.length;
            }
        }
        
        // 3. Insert at target position
        console.log(`Inserting ${movedChannel.name} at main position ${targetMainIndex + 1}`);
        this.channels.splice(targetMainIndex, 0, movedChannel);
        
        console.log('Final main array:', this.channels.map((ch, idx) => `${idx + 1}(${ch.name})`));
    }

    moveChannelInMainArray(channelToMove, newFilteredPos, newFilteredOrder) {
        // Remove channel from main array
        const currentMainIndex = this.channels.findIndex(ch => 
            ch.name === channelToMove.name && ch.url === channelToMove.url
        );
        
        if (currentMainIndex === -1) return;
        
        this.channels.splice(currentMainIndex, 1);
        
        // Calculate target position in main array
        let targetMainIndex;
        
        if (newFilteredPos === 0) {
            // Moving to first position in filtered view
            // Insert before the first other filtered channel in main array
            const nextFilteredChannel = newFilteredOrder[1];
            if (nextFilteredChannel) {
                const nextMainIndex = this.channels.findIndex(ch => 
                    ch.name === nextFilteredChannel.name && ch.url === nextFilteredChannel.url
                );
                targetMainIndex = nextMainIndex !== -1 ? nextMainIndex : 0;
            } else {
                targetMainIndex = 0;
            }
        } else {
            // Insert after the previous filtered channel in main array
            const prevFilteredChannel = newFilteredOrder[newFilteredPos - 1];
            const prevMainIndex = this.channels.findIndex(ch => 
                ch.name === prevFilteredChannel.name && ch.url === prevFilteredChannel.url
            );
            targetMainIndex = prevMainIndex !== -1 ? prevMainIndex + 1 : this.channels.length;
        }
        
        // Insert at calculated position
        this.channels.splice(targetMainIndex, 0, channelToMove);
        
        console.log(`Moved ${channelToMove.name} to main position ${targetMainIndex + 1}`);
    }

    updateFilteredChannelsOnly(newFilteredOrder) {
        // Only change the relative positions of the filtered channels in the main array
        // without affecting other channels
        
        // Find what actually changed
        const changes = [];
        for (let i = 0; i < newFilteredOrder.length; i++) {
            const newChannel = newFilteredOrder[i];
            const oldChannel = this.filteredChannels[i];
            
            if (!oldChannel || newChannel.name !== oldChannel.name || newChannel.url !== oldChannel.url) {
                // This position has a different channel now
                changes.push({
                    newPosition: i,
                    channel: newChannel,
                    oldPosition: this.filteredChannels.findIndex(ch => 
                        ch.name === newChannel.name && ch.url === newChannel.url
                    )
                });
            }
        }
        
        // Apply minimal changes to main array
        changes.forEach(change => {
            if (change.oldPosition !== -1 && change.oldPosition !== change.newPosition) {
                // Remove the channel from its old position in main array
                const mainOldIndex = this.channels.findIndex(ch => 
                    ch.name === change.channel.name && ch.url === change.channel.url
                );
                
                if (mainOldIndex !== -1) {
                    this.channels.splice(mainOldIndex, 1);
                    
                    // Find the new position in main array
                    let newMainIndex = 0;
                    
                    if (change.newPosition > 0) {
                        // Find the channel that should be before this one
                        const prevFilteredChannel = newFilteredOrder[change.newPosition - 1];
                        const prevMainIndex = this.channels.findIndex(ch => 
                            ch.name === prevFilteredChannel.name && ch.url === prevFilteredChannel.url
                        );
                        
                        if (prevMainIndex !== -1) {
                            newMainIndex = prevMainIndex + 1;
                        } else {
                            // Fallback: try to maintain relative position
                            newMainIndex = Math.min(change.newPosition, this.channels.length);
                        }
                    }
                    
                    // Insert at new position
                    this.channels.splice(newMainIndex, 0, change.channel);
                }
            }
        });
    }

    showSaveSuccess(url) {
        const saveSuccessInfo = document.getElementById('saveSuccessInfo');
        const savedUrlDisplay = document.getElementById('savedUrlDisplay');
        
        if (saveSuccessInfo && savedUrlDisplay) {
            savedUrlDisplay.value = url;
            saveSuccessInfo.style.display = 'block';
            
            // No need to scroll since modal is now at the top
            // saveSuccessInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('messageDisplay');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'messageDisplay';
            messageEl.className = 'message-display';
            
            // Insert at the top of the container
            const container = document.querySelector('.container');
            const header = document.querySelector('.header');
            if (container && header) {
                container.insertBefore(messageEl, header.nextSibling);
            }
        }
        
        messageEl.textContent = message;
        messageEl.className = `message-display ${type}`;
        messageEl.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.display = 'none';
            }
        }, 5000);
    }

    // Template Management System
    loadTemplates() {
        try {
            const stored = localStorage.getItem('m3u_templates');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading templates:', error);
            return {};
        }
    }

    saveTemplates() {
        try {
            localStorage.setItem('m3u_templates', JSON.stringify(this.templates));
        } catch (error) {
            console.error('Error saving templates:', error);
        }
    }

    createChannelSignature(channel) {
        // Create unique signature for channel matching
        const name = channel.name.toLowerCase().trim();
        const url = channel.url.toLowerCase().trim();
        
        // Normalize names (remove common variations)
        const normalizedName = name
            .replace(/\s+/g, ' ')                    // Multiple spaces
            .replace(/[\[\]()]/g, '')                // Remove brackets
            .replace(/\s*(hd|4k|fhd|uhd)\s*/gi, '')  // Quality tags
            .replace(/\s*(de|ger|germany)\s*/gi, '') // Country tags
            .trim();
        
        return {
            name: normalizedName,
            url: url,
            originalName: channel.name
        };
    }

    createTemplate(templateName) {
        if (!templateName || !this.channels.length) {
            this.showMessage('Bitte geben Sie einen Template-Namen ein und laden Sie zuerst eine Playlist.', 'error');
            return;
        }

        const template = {
            name: templateName,
            created: new Date().toISOString(),
            channels: this.channels.map((channel, index) => ({
                position: index + 1,
                signature: this.createChannelSignature(channel),
                category: channel.category || 'General'
            }))
        };

        this.templates[templateName] = template;
        this.saveTemplates();
        this.updateTemplateSelector();
        this.showMessage(`Template "${templateName}" erfolgreich erstellt!`, 'success');
    }

    applyTemplate(templateName) {
        const template = this.templates[templateName];
        if (!template) {
            this.showMessage('Template nicht gefunden!', 'error');
            return;
        }

        if (!this.channels.length) {
            this.showMessage('Bitte laden Sie zuerst eine Playlist.', 'error');
            return;
        }

        const sortingResults = this.applySortingTemplate(template);
        this.displaySortingResults(sortingResults);
    }

    applySortingTemplate(template) {
        const results = {
            matched: [],
            newChannels: [],
            duplicates: [],
            notFound: []
        };

        // Create mapping of current channels
        const currentChannelMap = new Map();
        this.channels.forEach((channel, index) => {
            const sig = this.createChannelSignature(channel);
            const key = `${sig.name}|${sig.url}`;
            
            if (currentChannelMap.has(key)) {
                // Duplicate found
                results.duplicates.push({
                    channel: channel,
                    originalIndex: index,
                    duplicate: currentChannelMap.get(key)
                });
            } else {
                currentChannelMap.set(key, {
                    channel: channel,
                    originalIndex: index,
                    signature: sig
                });
            }
        });

        // Map template positions
        const sortedChannels = new Array(this.channels.length);
        const usedPositions = new Set();
        const unmatchedChannels = [...this.channels];

        // Step 1: Exact matches
        template.channels.forEach(templateChannel => {
            const key = `${templateChannel.signature.name}|${templateChannel.signature.url}`;
            const match = currentChannelMap.get(key);
            
            if (match && templateChannel.position <= sortedChannels.length) {
                const targetPos = templateChannel.position - 1;
                
                if (!usedPositions.has(targetPos)) {
                    sortedChannels[targetPos] = match.channel;
                    usedPositions.add(targetPos);
                    
                    // Remove from unmatched
                    const unmatchedIndex = unmatchedChannels.findIndex(ch => ch === match.channel);
                    if (unmatchedIndex !== -1) {
                        unmatchedChannels.splice(unmatchedIndex, 1);
                    }
                    
                    results.matched.push({
                        channel: match.channel,
                        templatePosition: templateChannel.position,
                        actualPosition: targetPos + 1
                    });
                } else {
                    // Position already taken - conflict handling
                    results.newChannels.push({
                        channel: match.channel,
                        reason: 'position_conflict',
                        wantedPosition: templateChannel.position
                    });
                }
            } else if (!match) {
                // Channel in template but not in current list
                results.notFound.push({
                    templateChannel: templateChannel,
                    position: templateChannel.position
                });
            }
        });

        // Step 2: Insert unmatched channels in free positions
        let nextFreePosition = 0;
        unmatchedChannels.forEach(channel => {
            // Find next free position
            while (nextFreePosition < sortedChannels.length && sortedChannels[nextFreePosition] !== undefined) {
                nextFreePosition++;
            }
            
            if (nextFreePosition < sortedChannels.length) {
                sortedChannels[nextFreePosition] = channel;
                results.newChannels.push({
                    channel: channel,
                    reason: 'new_channel',
                    position: nextFreePosition + 1
                });
            } else {
                // Append at end if all positions taken
                sortedChannels.push(channel);
                results.newChannels.push({
                    channel: channel,
                    reason: 'appended',
                    position: sortedChannels.length
                });
            }
        });

        // Step 3: Fill null values with remaining channels
        const finalChannels = sortedChannels.filter(ch => ch !== undefined);
        
        // Update channels
        this.channels = finalChannels;
        this.updateChannelNumbers();
        
        // Update filtered channels to reflect the new sorting
        this.filteredChannels = [...this.channels];
        
        // Re-render to show the new order immediately
        this.renderChannels();

        return results;
    }

    displaySortingResults(results) {
        const totalChannels = this.channels.length;
        const matchedCount = results.matched.length;
        const newCount = results.newChannels.length;
        const duplicateCount = results.duplicates.length;
        const notFoundCount = results.notFound.length;

        let message = `Template angewendet:\n`;
        message += `✅ ${matchedCount} Sender sortiert\n`;
        
        if (newCount > 0) {
            message += `🆕 ${newCount} neue/unbekannte Sender\n`;
        }
        
        if (duplicateCount > 0) {
            message += `⚠️ ${duplicateCount} doppelte Sender gefunden\n`;
        }
        
        if (notFoundCount > 0) {
            message += `❌ ${notFoundCount} Template-Sender nicht gefunden\n`;
        }

        this.showMessage(message, 'success');

        // Detailed logs for debugging
        console.log('Template Sorting Results:', {
            total: totalChannels,
            matched: results.matched,
            newChannels: results.newChannels,
            duplicates: results.duplicates,
            notFound: results.notFound
        });
    }

    updateTemplateSelector() {
        const selector = document.getElementById('templateSelector');
        if (!selector) return;

        selector.innerHTML = '<option value="">Vorlage auswählen...</option>';
        
        Object.keys(this.templates).forEach(templateName => {
            const option = document.createElement('option');
            option.value = templateName;
            option.textContent = templateName;
            selector.appendChild(option);
        });
    }

    deleteTemplate(templateName) {
        if (confirm(`Template "${templateName}" wirklich löschen?`)) {
            delete this.templates[templateName];
            this.saveTemplates();
            this.updateTemplateSelector();
            this.showMessage(`Template "${templateName}" gelöscht.`, 'success');
        }
    }

    downloadTemplate(templateName) {
        const template = this.templates[templateName];
        if (!template) {
            this.showMessage('Template nicht gefunden!', 'error');
            return;
        }

        try {
            // Create template export object with metadata
            const exportData = {
                exportedAt: new Date().toISOString(),
                exportedBy: 'IPTV M3U Sorter',
                version: '1.0',
                template: template
            };

            // Convert to JSON string with pretty formatting
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Create blob and download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${template.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}_template.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showMessage(`Template "${templateName}" erfolgreich heruntergeladen!`, 'success');
        } catch (error) {
            this.showMessage('Fehler beim Download: ' + error.message, 'error');
        }
    }

    uploadTemplate() {
        // Create file input for template upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processTemplateFile(file);
            }
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    async processTemplateFile(file) {
        if (!file.name.toLowerCase().endsWith('.json')) {
            this.showMessage('Bitte wählen Sie eine gültige JSON-Datei aus.', 'error');
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate template structure
            if (!data.template || !data.template.name || !data.template.channels) {
                throw new Error('Ungültiges Template-Format');
            }
            
            const template = data.template;
            const templateName = template.name;
            
            // Check if template already exists
            if (this.templates[templateName]) {
                const replace = confirm(`Template "${templateName}" existiert bereits.\n\nMöchten Sie es ersetzen?`);
                if (!replace) return;
            }
            
            // Import template
            this.templates[templateName] = {
                ...template,
                imported: new Date().toISOString(),
                originalExport: data.exportedAt || 'Unknown'
            };
            
            this.saveTemplates();
            this.updateTemplateSelector();
            this.showMessage(`Template "${templateName}" erfolgreich importiert!`, 'success');
            
        } catch (error) {
            this.showMessage('Fehler beim Importieren: ' + error.message, 'error');
        }
    }

    resetPlaylist() {
        this.channels = [];
        this.filteredChannels = [];
        this.currentPlaylistId = null;
        
        // Hide playlist section and show upload section
        const uploadSection = document.getElementById('uploadSection');
        const playlistSection = document.getElementById('playlistSection');
        
        if (playlistSection) playlistSection.style.display = 'none';
        if (uploadSection) uploadSection.style.display = 'block';
        
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
        
        this.showMessage('Playlist zurückgesetzt.', 'info');
    }

    // Simple test function for your exact scenario
    testSimpleDrag() {
        // Test scenario: Move channel 216 before channel 215
        console.log('=== SIMPLE DRAG TEST ===');
        
        // Example channels (your scenario)
        const testChannels = [
            { name: 'Sender 1', channelNumber: 213 },
            { name: 'Sender 2', channelNumber: 214 },
            { name: 'Sender 3', channelNumber: 215 },
            { name: 'Sender 4', channelNumber: 216 },
            { name: 'Sender 5', channelNumber: 217 }
        ];
        
        console.log('BEFORE:', testChannels.map(ch => `${ch.channelNumber} (${ch.name})`));
        
        // Move Sender 4 (216) before Sender 3 (215) -> should become 214
        const senderToMove = testChannels.find(ch => ch.channelNumber === 216); // Sender 4
        const targetSender = testChannels.find(ch => ch.channelNumber === 215);  // Sender 3
        
        if (senderToMove && targetSender) {
            // Remove sender to move
            const fromIndex = testChannels.indexOf(senderToMove);
            testChannels.splice(fromIndex, 1);
            
            // Find where to insert (before target)
            const targetIndex = testChannels.indexOf(targetSender);
            testChannels.splice(targetIndex, 0, senderToMove);
            
            // Renumber all channels
            testChannels.forEach((ch, index) => {
                ch.channelNumber = 213 + index; // Start from 213
            });
        }
        
        console.log('AFTER:', testChannels.map(ch => `${ch.channelNumber} (${ch.name})`));
        console.log('=== Expected: 213(S1), 214(S4), 215(S3), 216(S2), 217(S5) ===');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.m3uSorter = new M3USorter();
});

// Global functions for UI
function hideSaveSuccess() {
    const saveSuccessInfo = document.getElementById('saveSuccessInfo');
    if (saveSuccessInfo) {
        saveSuccessInfo.style.display = 'none';
    }
}

function copyUrl() {
    const savedUrlDisplay = document.getElementById('savedUrlDisplay');
    if (savedUrlDisplay) {
        savedUrlDisplay.select();
        savedUrlDisplay.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            // Show temporary feedback
            const copyBtn = document.querySelector('.copy-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Kopiert!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }
        } catch (err) {
            // Fallback for modern browsers
            navigator.clipboard.writeText(savedUrlDisplay.value).then(() => {
                console.log('URL copied to clipboard');
            }).catch(() => {
                alert('URL in die Zwischenablage kopiert!');
            });
        }
    }
}

// Legacy functions for modal (if still needed)
function closeSaveModal() {
    const saveModal = document.getElementById('saveModal');
    if (saveModal) {
        saveModal.style.display = 'none';
    }
}

// Global function for editing channel numbers
function editChannelNumber(element, index) {
    console.log('Edit channel number called:', { element, index, channelName: window.m3uSorter?.filteredChannels[index]?.name });
    
    const currentNumber = element.textContent.trim();
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = window.m3uSorter ? window.m3uSorter.filteredChannels.length : 1000;
    input.value = currentNumber;
    input.className = 'channel-number-input';
    input.style.width = '60px';
    input.style.textAlign = 'center';
    input.style.fontSize = '14px';
    input.style.border = '2px solid #007bff';
    input.style.borderRadius = '3px';
    
    // Prevent event bubbling
    input.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    input.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    
    element.style.display = 'none';
    element.parentNode.insertBefore(input, element);
    input.focus();
    input.select();
    
    let isFinishing = false; // Prevent double execution
    
    const finishEdit = async (saveChanges = true) => {
        if (isFinishing) return;
        isFinishing = true;
        
        console.log('Finishing edit:', { saveChanges, newValue: input.value, oldValue: currentNumber });
        
        element.style.display = 'block';
        if (input.parentNode) {
            input.parentNode.removeChild(input);
        }
        
        if (saveChanges) {
            const newNumber = parseInt(input.value);
            if (newNumber && !isNaN(newNumber) && newNumber !== parseInt(currentNumber)) {
                console.log('Moving channel from', index, 'to position', newNumber);
                if (window.m3uSorter) {
                    await window.m3uSorter.moveChannelToPosition(index, newNumber);
                }
            }
        }
    };
    
    // Handle blur (clicking outside)
    input.addEventListener('blur', () => {
        setTimeout(() => finishEdit(true), 100); // Small delay to allow other events
    });
    
    // Handle keyboard events
    input.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        console.log('Key pressed:', e.key);
        
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEdit(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finishEdit(false);
        }
    });
    
    // Prevent form submission or other unwanted behaviors
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
}

// Global template functions
window.saveCurrentTemplate = function() {
    if (window.m3uSorter) {
        window.m3uSorter.createTemplate();
    }
};

window.createTemplate = function() {
    const name = prompt('Template-Name eingeben:');
    if (name && window.m3uSorter) {
        window.m3uSorter.createTemplate(name.trim());
    }
};

window.applyTemplate = function() {
    const selector = document.getElementById('templateSelector');
    const templateName = selector ? selector.value : null;
    
    if (templateName && window.m3uSorter) {
        window.m3uSorter.applyTemplate(templateName);
    } else {
        alert('Bitte wählen Sie zuerst ein Template aus.');
    }
};

window.deleteTemplate = function() {
    const selector = document.getElementById('templateSelector');
    const templateName = selector ? selector.value : null;
    
    if (templateName && window.m3uSorter) {
        window.m3uSorter.deleteTemplate(templateName);
    } else {
        alert('Bitte wählen Sie zuerst ein Template aus.');
    }
};

window.downloadTemplate = function() {
    const selector = document.getElementById('templateSelector');
    const templateName = selector ? selector.value : null;
    
    if (templateName && window.m3uSorter) {
        window.m3uSorter.downloadTemplate(templateName);
    } else {
        alert('Bitte wählen Sie zuerst ein Template aus.');
    }
};

window.uploadTemplate = function() {
    if (window.m3uSorter) {
        window.m3uSorter.uploadTemplate();
    }
};

// Global function to clear filters
window.clearFilters = function() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    
    if (window.m3uSorter) {
        window.m3uSorter.filterChannels();
        window.m3uSorter.showMessage('Filter geleert. Drag & Drop und Nummerierung sind wieder verfügbar.', 'success');
    }
};
