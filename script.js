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

// Gestion des choix multiples dynamiques
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
    
    // Focus sur le nouveau champ
    choiceItem.querySelector('input').focus();
    
    // Faire défiler vers le nouveau choix
    choiceItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeChoice(element) {
    const choiceItem = element.parentElement;
    choiceItem.remove();
    
    // Renuméroter les choix restants
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
    
    // Ajouter 2 choix par défaut
    addNewChoice();
    addNewChoice();
}

// Afficher le dialogue d'importation
function showImportDialog() {
    const importControls = document.getElementById('importControls');
    importControls.classList.add('active');
    document.getElementById('importTextarea').value = '';
    document.getElementById('importAlert').innerHTML = '';
    
    // Scroll vers l'import dialog
    setTimeout(() => {
        importControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Annuler l'importation
function cancelImport() {
    document.getElementById('importControls').classList.remove('active');
    document.getElementById('importTextarea').value = '';
    document.getElementById('importAlert').innerHTML = '';
}

// Importer le JSON
function importJSON() {
    const textarea = document.getElementById('importTextarea');
    const jsonText = textarea.value.trim();
    
    if (!jsonText) {
        showAlert('importAlert', 'Veuillez coller du JSON dans la zone de texte.', 'warning');
        return;
    }

    try {
        const importedData = JSON.parse(jsonText);
        
        // Vérifier que la structure est valide
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

        // Si on arrive ici, le JSON semble valide
        const confirmImport = confirm(
            'Voulez-vous vraiment importer ce dialogue ?\n' +
            'Cela remplacera complètement le dialogue actuel.\n\n' +
            'Messages dans la racine : ' + root.messages.length + '\n' +
            'Branches : ' + (root.branches ? Object.keys(root.branches).length : 0)
        );

        if (confirmImport) {
            // Sauvegarder l'ancien dialogue au cas où
            const oldTree = JSON.stringify(dialogueTree);
            
            try {
                // Importer le nouveau dialogue
                dialogueTree = importedData;
                currentPath = ['root'];
                
                // Mettre à jour le compteur d'ID des messages
                updateMessageIdCounter();
                
                // Mettre à jour l'affichage
                updateDisplay();
                
                // Masquer le dialogue d'importation
                cancelImport();
                
                showAlert('exportAlert', 'Dialogue importé avec succès !', 'success');
                
            } catch (error) {
                // Restaurer l'ancien dialogue en cas d'erreur
                dialogueTree = JSON.parse(oldTree);
                throw error;
            }
        }

    } catch (error) {
        console.error('Erreur d\'importation:', error);
        showAlert('importAlert', 'Erreur lors de l\'importation : ' + error.message, 'error');
    }
}

// Mettre à jour le compteur d'ID des messages
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

// Copier le JSON dans le presse-papiers
async function copyToClipboard() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput.value) {
        exportJSON(); // Générer le JSON s'il n'existe pas
    }
    
    try {
        await navigator.clipboard.writeText(jsonOutput.value);
        showAlert('exportAlert', 'JSON copié dans le presse-papiers !', 'success');
    } catch (error) {
        // Fallback pour les navigateurs plus anciens
        jsonOutput.select();
        document.execCommand('copy');
        showAlert('exportAlert', 'JSON copié dans le presse-papiers !', 'success');
    }
}

// Définir la date/heure actuelle
function setCurrentDateTime() {
    const now = new Date();
    const datetimeInput = document.getElementById('datetimeInput');
    // Format ISO pour datetime-local (YYYY-MM-DDTHH:mm)
    const isoString = now.toISOString().slice(0, 16);
    datetimeInput.value = isoString;
}

// Effacer la date/heure
function clearDateTime() {
    document.getElementById('datetimeInput').value = '';
}

// Formater la date pour l'affichage
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

// Mettre à jour l'affichage
function updateDisplay() {
    const node = getCurrentNode();
    const messagesContainer = document.getElementById('messagesContainer');
    const headerTitle = document.getElementById('headerTitle');
    const breadcrumb = document.getElementById('breadcrumb');
    const backBtn = document.getElementById('backBtn');
    const statusMessage = document.getElementById('statusMessage');
    const pathInfo = document.getElementById('pathInfo');
    
    // Mettre à jour le titre et le fil d'Ariane
    const pathDisplay = currentPath.map((step, index) => {
        if (step === 'root') return 'Racine';
        const parentNode = getNodeAtPath(currentPath.slice(0, index));
        if (parentNode && parentNode.choices) {
            const choiceIndex = parseInt(step.replace('choice_', ''));
            return `"${parentNode.choices[choiceIndex] || step}"`;
        }
        return step;
    }).join(' → ');
    
    headerTitle.textContent = `Dialogue - ${pathDisplay}`;
    breadcrumb.textContent = pathDisplay;
    backBtn.disabled = currentPath.length === 1;
    
    // Mettre à jour les informations de chemin
    pathInfo.textContent = `Profondeur actuelle: ${currentPath.length - 1} | Messages dans cette branche: ${node.messages.length}`;
    
    // Effacer les messages actuels
    messagesContainer.innerHTML = '';
    
    // Afficher les messages de cette branche
    if (node.messages.length === 0) {
        statusMessage.textContent = 'Aucun message dans cette branche. Commencez à écrire...';
        messagesContainer.appendChild(statusMessage);
    } else {
        node.messages.forEach(msg => {
            displayMessage(msg);
        });
        
        // Afficher les choix s'il y en a
        if (node.choices) {
            displayChoicesForSelection(node.choices);
        }
    }
    
    // Mettre à jour la vue de l'arbre
    updateTreeView();
    
    // Faire défiler vers le bas
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

// Afficher un message
function displayMessage(messageData) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    
    const isCharacterA = messageData.character === 'A';
    messageDiv.className = `message ${isCharacterA ? 'received' : 'sent'}`;
    
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

// Afficher les choix pour sélection
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
            const branchExists = node.branches[`choice_${index}`] !== undefined;
            const selectedClass = branchExists ? 'selected' : '';
            
            choicesHtml += `
                <div class="message-bubble choice-bubble ${selectedClass}" 
                        onclick="selectChoice(${index})">
                    ${index + 1}. ${choice}
                    ${branchExists ? ' ✓' : ''}
                </div>
            `;
        }
    });
    
    choicesHtml += '</div>';
    choicesDiv.innerHTML = choicesHtml;
    messagesContainer.appendChild(choicesDiv);
}

// Ajouter un message
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
    
    // Ajouter le message au nœud actuel
    const node = getCurrentNode();
    node.messages.push(messageData);
    
    // Réinitialiser les inputs
    messageInput.value = '';
    
    // Mettre à jour l'affichage
    updateDisplay();
}

// Ajouter un point de choix
function addChoicePoint() {
    const choiceControls = document.getElementById('choiceControls');
    choiceControls.classList.add('active');
    initializeChoices();
    
    // Scroll vers le dialogue de choix
    setTimeout(() => {
        choiceControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Sauvegarder le point de choix
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
    
    // Ajouter les choix au nœud actuel
    const node = getCurrentNode();
    node.choices = choices;
    
    // Initialiser les branches vides pour chaque choix
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
    
    // Réinitialiser et masquer les contrôles de choix
    document.getElementById('choiceControls').classList.remove('active');
    
    // Mettre à jour l'affichage
    updateDisplay();
}

function cancelChoice() {
    document.getElementById('choiceControls').classList.remove('active');
}

// Sélectionner un choix et naviguer vers cette branche
function selectChoice(index) {
    const node = getCurrentNode();
    if (node.choices && node.branches[`choice_${index}`]) {
        currentPath.push(`choice_${index}`);
        updateDisplay();
    }
}

// Retourner à la branche précédente
function goBack() {
    if (currentPath.length > 1) {
        currentPath.pop();
        updateDisplay();
    }
}

// Finir une branche (marquer comme terminée)
function finishBranch() {
    const node = getCurrentNode();
    node.finished = true;
    alert('Branche marquée comme terminée !');
    updateDisplay();
}

// Mettre à jour la vue de l'arbre
function updateTreeView() {
    const treeView = document.getElementById('treeView');
    treeView.innerHTML = '';
    renderTreeNode(dialogueTree.root, 0, treeView, ['root']);
}

function renderTreeNode(node, depth, container, path) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    
    // Marquer le chemin actuel
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
    
    nodeDiv.innerHTML = `
        <div class="tree-message">
            <span>
                <span class="tree-depth-indicator">${depthIndicator}</span>
                ${nodeText} (${node.messages.length} msg${node.messages.length !== 1 ? 's' : ''})
                ${node.finished ? ' ✅' : ''}
                ${node.choices ? ` [${node.choices.length} choix]` : ''}
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
    
    // Afficher les branches enfants
    if (node.choices && node.branches) {
        node.choices.forEach((choice, index) => {
            const choiceKey = `choice_${index}`;
            if (node.branches[choiceKey]) {
                renderTreeNode(
                    node.branches[choiceKey], 
                    depth + 1, 
                    container, 
                    [...path, choiceKey]
                );
            }
        });
    }
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, i) => val === b[i]);
}

// Effacer tout
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

// Exporter en JSON
function exportJSON() {
    const jsonOutput = document.getElementById('jsonOutput');
    const formattedJSON = JSON.stringify(dialogueTree, null, 2);
    jsonOutput.value = formattedJSON;
    showAlert('exportAlert', 'JSON exporté avec succès !', 'success');
}

// Permettre d'envoyer avec Entrée
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addMessage();
    }
});

// Initialiser l'affichage
updateDisplay();