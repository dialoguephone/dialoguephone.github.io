// Structure principale de l'arbre de dialogue
let dialogueTree = {
    root: {
        id: 'root',
        messages: [],
        choices: null,
        branches: {}
    }
};

// État actuel de navigation
let currentPath = ['root'];
let messageIdCounter = 0;
let choiceCounter = 0;
let editingMessageId = null;
let editingChoiceIndex = null;

// Obtenir le nœud actuel
function getCurrentNode() {
    let node = dialogueTree.root;
    for (let i = 1; i < currentPath.length; i++) {
        node = node.branches[currentPath[i]];
    }
    return node;
}

// Afficher une alerte
function showAlert(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert ${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// ============ GESTION DES CHOIX NORMAUX ============
function addNewChoice() {
    const choicesList = document.getElementById('choicesList');
    const choiceIndex = choicesList.children.length;
    
    const choiceItem = document.createElement('div');
    choiceItem.className = 'choice-item';
    choiceItem.innerHTML = `
        <span style="min-width: 20px; font-weight: bold;">${choiceIndex + 1}.</span>
        <input type="text" placeholder="Entrez le texte du choix..." data-index="${choiceIndex}">
        <span class="remove-choice" onclick="removeChoice(this)" title="Supprimer ce choix">×</span>
    `;
    
    choicesList.appendChild(choiceItem);
    choiceItem.querySelector('input').focus();
    choiceItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeChoice(element) {
    const choiceItem = element.parentElement;
    choiceItem.remove();
    
    const choicesList = document.getElementById('choicesList');
    Array.from(choicesList.children).forEach((item, index) => {
        const span = item.querySelector('span');
        const input = item.querySelector('input');
        span.textContent = `${index + 1}.`;
        input.setAttribute('data-index', index);
    });
}

function initializeChoices() {
    const choicesList = document.getElementById('choicesList');
    choicesList.innerHTML = '';
    addNewChoice();
    addNewChoice();
}

function addChoicePoint() {
    const choiceControls = document.getElementById('choiceControls');
    choiceControls.classList.add('active');
    initializeChoices();
    
    setTimeout(() => {
        choiceControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function saveChoicePoint() {
    const choicesList = document.getElementById('choicesList');
    const choiceInputs = choicesList.querySelectorAll('input');
    const choices = [];
    
    choiceInputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            choices.push(value);
        }
    });
    
    if (choices.length < 2) {
        alert('Veuillez entrer au moins 2 options de choix.');
        return;
    }
    
    const node = getCurrentNode();
    node.choices = choices;
    
    choices.forEach((choice, index) => {
        if (!node.branches[`choice_${index}`]) {
            node.branches[`choice_${index}`] = {
                id: `choice_${index}`,
                choiceText: choice,
                messages: [],
                choices: null,
                branches: {}
            };
        }
    });
    
    document.getElementById('choiceControls').classList.remove('active');
    updateDisplay();
}

function cancelChoice() {
    document.getElementById('choiceControls').classList.remove('active');
}

// ============ GESTION DES FAKE CHOICES ============
function addNewFakeChoice() {
    const fakeChoicesList = document.getElementById('fakeChoicesList');
    const choiceIndex = fakeChoicesList.children.length;
    
    const choiceItem = document.createElement('div');
    choiceItem.className = 'choice-item';
    choiceItem.innerHTML = `
        <span style="min-width: 20px; font-weight: bold;">👻 ${choiceIndex + 1}.</span>
        <input type="text" placeholder="Entrez le texte du fake choice..." data-index="${choiceIndex}">
        <span class="remove-choice" onclick="removeFakeChoice(this)" title="Supprimer ce fake choice">×</span>
    `;
    
    fakeChoicesList.appendChild(choiceItem);
    choiceItem.querySelector('input').focus();
    choiceItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeFakeChoice(element) {
    const choiceItem = element.parentElement;
    choiceItem.remove();
    
    const fakeChoicesList = document.getElementById('fakeChoicesList');
    Array.from(fakeChoicesList.children).forEach((item, index) => {
        const span = item.querySelector('span');
        const input = item.querySelector('input');
        span.textContent = `👻 ${index + 1}.`;
        input.setAttribute('data-index', index);
    });
}

function initializeFakeChoices() {
    const fakeChoicesList = document.getElementById('fakeChoicesList');
    fakeChoicesList.innerHTML = '';
    addNewFakeChoice();
}

function addFakeChoice() {
    const fakeChoiceControls = document.getElementById('fakeChoiceControls');
    fakeChoiceControls.classList.add('active');
    initializeFakeChoices();
    
    setTimeout(() => {
        fakeChoiceControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function saveFakeChoicePoint() {
    const fakeChoicesList = document.getElementById('fakeChoicesList');
    const choiceInputs = fakeChoicesList.querySelectorAll('input');
    const fakeChoices = [];
    
    choiceInputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            fakeChoices.push(value);
        }
    });
    
    if (fakeChoices.length < 1) {
        alert('Veuillez entrer au moins 1 fake choice.');
        return;
    }
    
    const node = getCurrentNode();
    if (!node.choices) {
        node.choices = [];
    }
    
    const normalChoicesCount = Object.keys(node.branches).filter(k => !k.includes('_fake')).length;
    
    fakeChoices.forEach((choice, index) => {
        const fakeIndex = normalChoicesCount + index;
        const branchKey = `choice_${fakeIndex}_fake`;
        
        if (!node.branches[branchKey]) {
            node.choices.push(choice);
            node.branches[branchKey] = {
                id: branchKey,
                choiceText: choice,
                isFakeChoice: true,
                reconnectsTo: null,
                messages: [],
                choices: null,
                branches: {}
            };
        }
    });
    
    document.getElementById('fakeChoiceControls').classList.remove('active');
    updateDisplay();
}

function cancelFakeChoice() {
    document.getElementById('fakeChoiceControls').classList.remove('active');
}

// ============ GESTION DE LA RECONNEXION DES FAKE CHOICES ============
function finishBranch() {
    const node = getCurrentNode();
    
    // Vérifier si on est dans un fake choice
    const currentBranchKey = currentPath[currentPath.length - 1];
    if (currentBranchKey && currentBranchKey.includes('_fake')) {
        showReconnectionDialog();
    } else {
        node.finished = true;
        alert('Branche marquée comme terminée !');
        updateDisplay();
    }
}

function showReconnectionDialog() {
    const finishFakeChoiceControls = document.getElementById('finishFakeChoiceControls');
    const reconnectSelect = document.getElementById('reconnectSelect');
    
    // Remplir la liste des messages de la branche parent
    reconnectSelect.innerHTML = '<option value="">-- Choisir un message --</option>';
    
    // Trouver le nœud parent (avant le fake choice)
    const parentPath = currentPath.slice(0, -1);
    let parentNode = dialogueTree.root;
    for (let i = 1; i < parentPath.length; i++) {
        parentNode = parentNode.branches[parentPath[i]];
    }
    
    // Ajouter les messages du parent
    parentNode.messages.forEach((msg, index) => {
        const preview = msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : '');
        reconnectSelect.innerHTML += `<option value="${msg.id}">Message ${msg.id}: ${preview}</option>`;
    });
    
    finishFakeChoiceControls.classList.add('active');
    setTimeout(() => {
        finishFakeChoiceControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function saveReconnection() {
    const reconnectSelect = document.getElementById('reconnectSelect');
    const selectedMessageId = parseInt(reconnectSelect.value);
    
    if (!selectedMessageId) {
        alert('Veuillez sélectionner un message de reconnexion.');
        return;
    }
    
    const node = getCurrentNode();
    node.reconnectsTo = selectedMessageId;
    node.finished = true;
    
    document.getElementById('finishFakeChoiceControls').classList.remove('active');
    alert('Fake choice terminé et reconnecté !');
    updateDisplay();
}

function cancelReconnection() {
    document.getElementById('finishFakeChoiceControls').classList.remove('active');
}

// ============ ÉDITION DE MESSAGES ============
function editMessage(messageId) {
    const node = getCurrentNode();
    const message = node.messages.find(m => m.id === messageId);
    
    if (!message) return;
    
    editingMessageId = messageId;
    
    const editMessageControls = document.getElementById('editMessageControls');
    const editCharacterSelect = document.getElementById('editCharacterSelect');
    const editMessageInput = document.getElementById('editMessageInput');
    const editDatetimeInput = document.getElementById('editDatetimeInput');
    
    editCharacterSelect.value = message.character;
    editMessageInput.value = message.text;
    editDatetimeInput.value = message.datetime || '';
    
    editMessageControls.classList.add('active');
    setTimeout(() => {
        editMessageControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
        editMessageInput.focus();
    }, 100);
}

function saveEditedMessage() {
    const node = getCurrentNode();
    const message = node.messages.find(m => m.id === editingMessageId);
    
    if (!message) return;
    
    const editCharacterSelect = document.getElementById('editCharacterSelect');
    const editMessageInput = document.getElementById('editMessageInput');
    const editDatetimeInput = document.getElementById('editDatetimeInput');
    
    message.character = editCharacterSelect.value;
    message.text = editMessageInput.value.trim();
    message.datetime = editDatetimeInput.value || null;
    
    editingMessageId = null;
    document.getElementById('editMessageControls').classList.remove('active');
    updateDisplay();
}

function deleteMessage() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;
    
    const node = getCurrentNode();
    const messageIndex = node.messages.findIndex(m => m.id === editingMessageId);
    
    if (messageIndex !== -1) {
        node.messages.splice(messageIndex, 1);
    }
    
    editingMessageId = null;
    document.getElementById('editMessageControls').classList.remove('active');
    updateDisplay();
}

function cancelEditMessage() {
    editingMessageId = null;
    document.getElementById('editMessageControls').classList.remove('active');
}

// ============ ÉDITION DE CHOIX ============
function editChoice(choiceIndex) {
    const node = getCurrentNode();
    if (!node.choices || !node.choices[choiceIndex]) return;
    
    editingChoiceIndex = choiceIndex;
    
    const editChoiceControls = document.getElementById('editChoiceControls');
    const editChoiceInput = document.getElementById('editChoiceInput');
    
    editChoiceInput.value = node.choices[choiceIndex];
    
    editChoiceControls.classList.add('active');
    setTimeout(() => {
        editChoiceControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
        editChoiceInput.focus();
    }, 100);
}

function saveEditedChoice() {
    const node = getCurrentNode();
    const editChoiceInput = document.getElementById('editChoiceInput');
    const newText = editChoiceInput.value.trim();
    
    if (!newText) {
        alert('Le texte du choix ne peut pas être vide.');
        return;
    }
    
    node.choices[editingChoiceIndex] = newText;
    
    // Mettre à jour aussi le texte dans la branche correspondante
    const branchKeys = Object.keys(node.branches);
    const normalChoices = branchKeys.filter(k => !k.includes('_fake'));
    const fakeChoices = branchKeys.filter(k => k.includes('_fake'));
    
    let targetBranchKey;
    if (editingChoiceIndex < normalChoices.length) {
        targetBranchKey = `choice_${editingChoiceIndex}`;
    } else {
        targetBranchKey = fakeChoices[editingChoiceIndex - normalChoices.length];
    }
    
    if (node.branches[targetBranchKey]) {
        node.branches[targetBranchKey].choiceText = newText;
    }
    
    editingChoiceIndex = null;
    document.getElementById('editChoiceControls').classList.remove('active');
    updateDisplay();
}

function cancelEditChoice() {
    editingChoiceIndex = null;
    document.getElementById('editChoiceControls').classList.remove('active');
}

// ============ GESTION DE L'IMPORTATION ============
function showImportDialog() {
    const importControls = document.getElementById('importControls');
    importControls.classList.add('active');
    document.getElementById('importTextarea').value = '';
    document.getElementById('importAlert').innerHTML = '';
    
    setTimeout(() => {
        importControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function cancelImport() {
    document.getElementById('importControls').classList.remove('active');
    document.getElementById('importTextarea').value = '';
    document.getElementById('importAlert').innerHTML = '';
}

function importJSON() {
    const textarea = document.getElementById('importTextarea');
    const jsonText = textarea.value.trim();
    
    if (!jsonText) {
        showAlert('importAlert', 'Veuillez coller du JSON dans la zone de texte.', 'warning');
        return;
    }

    try {
        const importedData = JSON.parse(jsonText);
        
        if (!importedData.root || typeof importedData.root !== 'object') {
            throw new Error('Structure JSON invalide : propriété "root" manquante');
        }

        const root = importedData.root;
        if (!Array.isArray(root.messages)) {
            throw new Error('Structure JSON invalide : "root.messages" doit être un tableau');
        }

        if (root.branches && typeof root.branches !== 'object') {
            throw new Error('Structure JSON invalide : "root.branches" doit être un objet');
        }

        const confirmImport = confirm(
            'Voulez-vous vraiment importer ce dialogue ?\n' +
            'Cela remplacera complètement le dialogue actuel.\n\n' +
            'Messages dans la racine : ' + root.messages.length + '\n' +
            'Branches : ' + (root.branches ? Object.keys(root.branches).length : 0)
        );

        if (confirmImport) {
            const oldTree = JSON.stringify(dialogueTree);
            
            try {
                dialogueTree = importedData;
                currentPath = ['root'];
                updateMessageIdCounter();
                updateDisplay();
                cancelImport();
                showAlert('exportAlert', 'Dialogue importé avec succès !', 'success');
            } catch (error) {
                dialogueTree = JSON.parse(oldTree);
                throw error;
            }
        }

    } catch (error) {
        console.error('Erreur d\'importation:', error);
        showAlert('importAlert', 'Erreur lors de l\'importation : ' + error.message, 'error');
    }
}

function updateMessageIdCounter() {
    let maxId = 0;
    
    function traverseNode(node) {
        if (node.messages) {
            node.messages.forEach(msg => {
                if (msg.id && typeof msg.id === 'number' && msg.id > maxId) {
                    maxId = msg.id;
                }
            });
        }
        
        if (node.branches) {
            Object.values(node.branches).forEach(branch => {
                traverseNode(branch);
            });
        }
    }
    
    traverseNode(dialogueTree.root);
    messageIdCounter = maxId;
}

// ============ COPIE DANS LE PRESSE-PAPIERS ============
async function copyToClipboard() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput.value) {
        exportJSON();
    }
    
    try {
        await navigator.clipboard.writeText(jsonOutput.value);
        showAlert('exportAlert', 'JSON copié dans le presse-papiers !', 'success');
    } catch (error) {
        jsonOutput.select();
        document.execCommand('copy');
        showAlert('exportAlert', 'JSON copié dans le presse-papiers !', 'success');
    }
}

// ============ GESTION DE LA DATE/HEURE ============
function setCurrentDateTime() {
    const now = new Date();
    const datetimeInput = document.getElementById('datetimeInput');
    const isoString = now.toISOString().slice(0, 16);
    datetimeInput.value = isoString;
}

function clearDateTime() {
    document.getElementById('datetimeInput').value = '';
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('fr-FR', options);
}

// ============ AFFICHAGE ============
function updateDisplay() {
    const node = getCurrentNode();
    const messagesContainer = document.getElementById('messagesContainer');
    const headerTitle = document.getElementById('headerTitle');
    const breadcrumb = document.getElementById('breadcrumb');
    const backBtn = document.getElementById('backBtn');
    const statusMessage = document.getElementById('statusMessage');
    const pathInfo = document.getElementById('pathInfo');
    
    const pathDisplay = currentPath.map((step, index) => {
        if (step === 'root') return 'Racine';
        const parentNode = getNodeAtPath(currentPath.slice(0, index));
        if (parentNode && parentNode.choices) {
            const choiceIndex = parseInt(step.replace('choice_', '').replace('_fake', ''));
            const isFake = step.includes('_fake');
            return (isFake ? '👻 ' : '') + `"${parentNode.choices[choiceIndex] || step}"`;
        }
        return step;
    }).join(' → ');
    
    headerTitle.textContent = `Dialogue - ${pathDisplay}`;
    breadcrumb.textContent = pathDisplay;
    backBtn.disabled = currentPath.length === 1;
    
    pathInfo.textContent = `Profondeur actuelle: ${currentPath.length - 1} | Messages dans cette branche: ${node.messages.length}`;
    
    messagesContainer.innerHTML = '';
    
    if (node.messages.length === 0) {
        statusMessage.textContent = 'Aucun message dans cette branche. Commencez à écrire...';
        messagesContainer.appendChild(statusMessage);
    } else {
        // Trouver le point d'insertion des choix
        let choiceInsertionPoint = node.messages.length;
        
        // Si ce nœud a des choix avec des fake choices, trouver le point de reconnexion minimum
        if (node.choices && node.branches) {
            let minReconnectId = Infinity;
            
            Object.keys(node.branches).forEach(branchKey => {
                if (branchKey.includes('_fake') && node.branches[branchKey].reconnectsTo) {
                    const reconnectId = node.branches[branchKey].reconnectsTo;
                    if (reconnectId < minReconnectId) {
                        minReconnectId = reconnectId;
                    }
                }
            });
            
            // Trouver l'index du message de reconnexion
            if (minReconnectId !== Infinity) {
                const reconnectIndex = node.messages.findIndex(msg => msg.id === minReconnectId);
                if (reconnectIndex !== -1) {
                    choiceInsertionPoint = reconnectIndex;
                }
            }
        }
        
        // Afficher les messages avant les choix
        for (let i = 0; i < choiceInsertionPoint; i++) {
            displayMessage(node.messages[i]);
        }
        
        // Afficher les choix au bon endroit
        if (node.choices) {
            displayChoicesForSelection(node.choices);
        }
        
        // Afficher les messages après les choix
        for (let i = choiceInsertionPoint; i < node.messages.length; i++) {
            displayMessage(node.messages[i]);
        }
    }
    
    updateTreeView();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getNodeAtPath(path) {
    let node = dialogueTree.root;
    for (let i = 1; i < path.length; i++) {
        if (node.branches && node.branches[path[i]]) {
            node = node.branches[path[i]];
        } else {
            return null;
        }
    }
    return node;
}

function displayMessage(messageData) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    
    const isCharacterA = messageData.character === 'A';
    messageDiv.className = `message ${isCharacterA ? 'received' : 'sent'}`;
    messageDiv.onclick = () => editMessage(messageData.id);
    
    let timestampHtml = '';
    if (messageData.datetime) {
        const formattedDateTime = formatDateTime(messageData.datetime);
        timestampHtml = `<div class="message-timestamp">${formattedDateTime}</div>`;
    }
    
    messageDiv.innerHTML = `
        <div>
            <div class="character-label">Personnage ${messageData.character}</div>
            <div class="message-bubble">
                ${messageData.text}
                ${timestampHtml}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
}

function displayChoicesForSelection(choices) {
    const messagesContainer = document.getElementById('messagesContainer');
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'message sent';
    
    let choicesHtml = `
        <div>
            <div class="character-label">Choix disponibles</div>
    `;
    
    choices.forEach((choice, index) => {
        if (choice.trim()) {
            const node = getCurrentNode();
            const normalBranchKey = `choice_${index}`;
            const fakeBranchKey = `choice_${index}_fake`;
            
            const branchExists = node.branches[normalBranchKey] || node.branches[fakeBranchKey];
            const isFake = node.branches[fakeBranchKey] !== undefined;
            const selectedClass = branchExists ? 'selected' : '';
            const fakeClass = isFake ? 'fake-choice' : '';
            
            choicesHtml += `
                <div class="message-bubble choice-bubble ${selectedClass} ${fakeClass}" 
                        onclick="event.stopPropagation(); selectChoice(${index})">
                    ${index + 1}. ${choice}
                    ${branchExists ? ' ✓' : ''}
                    <span class="edit-icon" onclick="event.stopPropagation(); editChoice(${index})">✏️</span>
                </div>
            `;
        }
    });
    
    choicesHtml += '</div>';
    choicesDiv.innerHTML = choicesHtml;
    messagesContainer.appendChild(choicesDiv);
}

function addMessage() {
    const messageInput = document.getElementById('messageInput');
    const characterSelect = document.getElementById('characterSelect');
    const datetimeInput = document.getElementById('datetimeInput');
    
    const text = messageInput.value.trim();
    if (!text) return;
    
    const character = characterSelect.value;
    const datetime = datetimeInput.value;
    messageIdCounter++;
    
    const messageData = {
        id: messageIdCounter,
        character: character,
        text: text,
        datetime: datetime || null
    };
    
    const node = getCurrentNode();
    node.messages.push(messageData);
    
    messageInput.value = '';
    updateDisplay();
}

function selectChoice(index) {
    const node = getCurrentNode();
    const normalBranchKey = `choice_${index}`;
    const fakeBranchKey = `choice_${index}_fake`;
    
    if (node.branches[normalBranchKey]) {
        currentPath.push(normalBranchKey);
        updateDisplay();
    } else if (node.branches[fakeBranchKey]) {
        currentPath.push(fakeBranchKey);
        updateDisplay();
    }
}

function goBack() {
    if (currentPath.length > 1) {
        currentPath.pop();
        updateDisplay();
    }
}

// ============ VUE DE L'ARBRE ============
function updateTreeView() {
    const treeView = document.getElementById('treeView');
    treeView.innerHTML = '';
    renderTreeNode(dialogueTree.root, 0, treeView, ['root']);
}

function renderTreeNode(node, depth, container, path) {
    const nodeDiv = document.createElement('div');
    const isFake = path[path.length - 1] && path[path.length - 1].includes('_fake');
    nodeDiv.className = `tree-node ${isFake ? 'fake-choice-node' : ''}`;
    
    if (arraysEqual(path, currentPath)) {
        nodeDiv.classList.add('current-path');
    }
    
    let nodeText = path[path.length - 1];
    if (node.choiceText) {
        nodeText = `${node.choiceText.substring(0, 50)}${node.choiceText.length > 50 ? '...' : ''}`;
    } else if (path[path.length - 1] === 'root') {
        nodeText = 'Racine';
    }
    
    const depthIndicator = '└─'.repeat(depth);
    const fakeIcon = isFake ? '👻 ' : '';
    const reconnectInfo = node.reconnectsTo ? ` ↪️${node.reconnectsTo}` : '';
    
    nodeDiv.innerHTML = `
        <div class="tree-message">
            <span>
                <span class="tree-depth-indicator">${depthIndicator}</span>
                ${fakeIcon}${nodeText} (${node.messages.length} msg${node.messages.length !== 1 ? 's' : ''})
                ${node.finished ? ' ✅' : ''}
                ${node.choices ? ` [${node.choices.length} choix]` : ''}
                ${reconnectInfo}
            </span>
            <small style="color: #999;">Prof. ${depth}</small>
        </div>
    `;
    
    nodeDiv.style.marginLeft = (depth * 15) + 'px';
    nodeDiv.onclick = (e) => {
        e.stopPropagation();
        currentPath = [...path];
        updateDisplay();
    };
    
    container.appendChild(nodeDiv);
    
    if (node.choices && node.branches) {
        node.choices.forEach((choice, index) => {
            const normalKey = `choice_${index}`;
            const fakeKey = `choice_${index}_fake`;
            
            if (node.branches[normalKey]) {
                renderTreeNode(
                    node.branches[normalKey], 
                    depth + 1, 
                    container, 
                    [...path, normalKey]
                );
            } else if (node.branches[fakeKey]) {
                renderTreeNode(
                    node.branches[fakeKey], 
                    depth + 1, 
                    container, 
                    [...path, fakeKey]
                );
            }
        });
    }
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, i) => val === b[i]);
}

// ============ EFFACER TOUT ============
function clearAll() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'arbre de dialogue ?')) {
        dialogueTree = {
            root: {
                id: 'root',
                messages: [],
                choices: null,
                branches: {}
            }
        };
        currentPath = ['root'];
        messageIdCounter = 0;
        updateDisplay();
        document.getElementById('jsonOutput').value = '';
        showAlert('exportAlert', 'Dialogue effacé avec succès !', 'warning');
    }
}

// ============ EXPORTER EN JSON ============
function exportJSON() {
    const jsonOutput = document.getElementById('jsonOutput');
    const formattedJSON = JSON.stringify(dialogueTree, null, 2);
    jsonOutput.value = formattedJSON;
    showAlert('exportAlert', 'JSON exporté avec succès !', 'success');
}

// ============ INITIALISATION ============
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addMessage();
    }
});

updateDisplay();
