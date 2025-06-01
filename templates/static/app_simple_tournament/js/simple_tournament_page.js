document.addEventListener('DOMContentLoaded', function() {
    // === Variáveis de Elementos DOM ===
    const tournamentContainer = document.querySelector('.tournament-container');
    const tournamentId = tournamentContainer ? tournamentContainer.dataset.tournamentId : null;

    // Elementos da descrição editável (usando suas IDs)
    const descriptionText = document.getElementById('descriptionText');
    const editButton = document.getElementById('editButton');
    const editableInput = document.getElementById('editableInput');
    const saveForm = document.getElementById('saveForm');
    const saveButton = document.getElementById('saveButton');
    const hiddenDescription = document.getElementById('hiddenDescription');

    // Elementos do modal de adicionar jogador (usando suas IDs/classes)
    const openAddPlayerModalButton = document.getElementById('openAddPlayerModalButton'); // Seu botão
    const addPlayerModal = document.getElementById('addPlayerModal');
    const closeAddPlayerModalButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null;
    const addPlayerForm = document.getElementById('addPlayerForm');
    const playerFormError = document.getElementById('playerFormError');

    // Seção de jogadores
    const playersListContainer = document.querySelector('.players-list-container');
    const numPlayersSpan = document.getElementById('numPlayers'); // Seu span de contagem

    // Seção de formação de chaves
    const bracketPlayersList = document.getElementById('bracketPlayersList');
    const generateBracketButton = document.getElementById('generateBracketButton');

    // Container de mensagens (agora universal para Django e JS)
    const djangoMessagesUl = document.querySelector('ul.messages'); // Se o Django já rendeu mensagens
    const messagesWrapper = djangoMessagesUl ? djangoMessagesUl.parentElement : document.querySelector('.tournament-container');


    // === Funções Auxiliares ===

    /**
     * Exibe uma mensagem temporária na interface.
     * @param {string} message - O texto da mensagem a ser exibida.
     * @param {string} type - O tipo da mensagem ('success', 'info', 'warning', 'error').
     */
    function displayTemporaryMessage(message, type) {
        let targetContainer = messagesWrapper; 

        if (!djangoMessagesUl && !document.getElementById('js-messages-container')) {
            const jsMessagesDiv = document.createElement('div');
            jsMessagesDiv.id = 'js-messages-container';
            jsMessagesDiv.style.marginTop = '15px';
            jsMessagesDiv.style.marginBottom = '15px';
            targetContainer.prepend(jsMessagesDiv);
            targetContainer = jsMessagesDiv;
        } else if (djangoMessagesUl) {
            targetContainer = djangoMessagesUl;
        }

        const li = document.createElement('li');
        li.className = type;
        li.innerHTML = `${message} <span class="close-message-button" title="Fechar">&times;</span>`;
        targetContainer.prepend(li);

        li.querySelector('.close-message-button').addEventListener('click', function() {
            li.classList.add('hide');
            li.addEventListener('transitionend', function() {
                li.remove();
            }, { once: true });
        });

        setTimeout(() => {
            li.classList.add('hide');
            li.addEventListener('transitionend', function() {
                li.remove();
            }, { once: true });
        }, 5000);
    }

    /**
     * Atualiza a contagem de jogadores exibida na interface.
     * @param {number} change - O valor a ser adicionado ou subtraído da contagem atual.
     */
    function updatePlayerCount(change = 0) {
        if (numPlayersSpan) {
            let currentCount = parseInt(numPlayersSpan.textContent);
            if (!isNaN(currentCount)) {
                numPlayersSpan.textContent = Math.max(0, currentCount + change);
            }
        }
        const noPlayersMessage = playersListContainer ? playersListContainer.querySelector('.no-players-message') : null;
        if (noPlayersMessage) {
            if (parseInt(numPlayersSpan.textContent) === 0) {
                noPlayersMessage.style.display = 'block';
            } else {
                noPlayersMessage.style.display = 'none';
            }
        }
    }


    // === Event Listeners ===

    // --- Edição da Descrição ---
    if (descriptionText && editButton && editableInput && saveForm && saveButton && hiddenDescription) {

        function showEditableDescription() {
            descriptionText.style.display = 'none';
            editButton.style.display = 'none';
            editableInput.style.display = 'block';
            saveButton.style.display = 'block';
            if (descriptionText.textContent.trim() === "Edite a descrição do torneio aqui...") {
                 editableInput.value = '';
            } else {
                editableInput.value = descriptionText.textContent.trim();
            }
            editableInput.focus();
            editableInput.select();
        }

        function hideEditableDescription() {
            descriptionText.style.display = 'block';
            editButton.style.display = 'block';
            editableInput.style.display = 'none';
            saveButton.style.display = 'none';
            descriptionText.textContent = hiddenDescription.value;
        }

        editButton.addEventListener('click', showEditableDescription);
        descriptionText.addEventListener('click', showEditableDescription);

        saveForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const newDescription = editableInput.value.trim();
            hiddenDescription.value = newDescription || "Edite a descrição do torneio aqui...";

            const formData = new FormData(saveForm);

            fetch(saveForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || 'Erro desconhecido ao salvar descrição');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    descriptionText.textContent = data.description;
                    hideEditableDescription();
                    displayTemporaryMessage('Descrição atualizada com sucesso!', 'success');
                } else {
                    displayTemporaryMessage(data.error || 'Falha ao atualizar a descrição.', 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao salvar descrição:', error);
                displayTemporaryMessage(`Erro de rede ou servidor ao salvar descrição: ${error.message}`, 'error');
            });
        });

        editableInput.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                hideEditableDescription();
            }
        });

        editableInput.addEventListener('keydown', function(event) {
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                saveButton.click();
            }
        });
    }

    // --- Modal de Adicionar Jogador ---
    if (openAddPlayerModalButton && addPlayerModal && closeAddPlayerModalButton && addPlayerForm && playerFormError) {
        openAddPlayerModalButton.addEventListener('click', function() {
            addPlayerModal.style.display = 'flex';
            playerFormError.style.display = 'none';
            addPlayerForm.reset();
            document.getElementById('id_name').focus();
        });

        closeAddPlayerModalButton.addEventListener('click', function() {
            addPlayerModal.style.display = 'none';
        });

        window.addEventListener('click', function(event) {
            if (event.target == addPlayerModal) {
                addPlayerModal.style.display = 'none';
            }
        });

        addPlayerForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const playerNameInput = document.getElementById('id_name');
            const playerName = playerNameInput.value.trim();

            if (!playerName) {
                playerFormError.textContent = 'O nome do jogador não pode ser vazio.';
                playerFormError.style.display = 'block';
                return;
            }

            const formData = new FormData(addPlayerForm);

            fetch(addPlayerForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || 'Erro desconhecido ao adicionar jogador');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    addPlayerModal.style.display = 'none';
                    addPlayerForm.reset();
                    
                    const newPlayerCardHTML = `
                        <div class="player-card" data-player-id="${data.player.id}">
                            <span class="player-name">${data.player.name}</span>
                            <div class="delete-player-option" title="Excluir jogador">
                                <form action="/tournament/${tournamentId}/delete_player/${data.player.id}/" method="POST" style="display: inline;">
                                    <input type="hidden" name="csrfmiddlewaretoken" value="${data.csrf_token}">
                                    <button type="submit" class="delete-player-button" role="button" tabindex="0" aria-label="Excluir jogador">
                                        <i class='bx bx-trash'></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    `;
                    const playersGrid = playersListContainer.querySelector('.players-grid');
                    if (playersGrid) {
                        playersGrid.insertAdjacentHTML('beforeend', newPlayerCardHTML);
                    } else {
                        playersListContainer.insertAdjacentHTML('beforeend', newPlayerCardHTML);
                    }
                    updatePlayerCount(1);
                    displayTemporaryMessage('Jogador adicionado com sucesso!', 'success');
                } else {
                    playerFormError.textContent = data.error || 'Erro ao adicionar jogador.';
                    playerFormError.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Erro ao adicionar jogador:', error);
                playerFormError.textContent = `Erro de rede ou servidor ao adicionar jogador: ${error.message}`;
                playerFormError.style.display = 'block';
                displayTemporaryMessage(`Erro: ${error.message}`, 'error');
            });
        });
    }

    // --- Exclusão de Jogador ---
    if (playersListContainer) {
        playersListContainer.addEventListener('click', function(event) {
            const deleteButton = event.target.closest('.delete-player-button');
            if (deleteButton) {
                event.preventDefault();

                const playerCard = deleteButton.closest('.player-card');
                const playerId = playerCard.dataset.playerId;

                const form = deleteButton.closest('form');
                const url = form.action;
                const csrfToken = form.querySelector('input[name="csrfmiddlewaretoken"]').value;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                    },
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(errorData.error || 'Erro desconhecido do servidor');
                        }).catch(() => {
                            throw new Error(`Erro no servidor: Status ${response.status}`);
                        });
                    }
                    if (response.status === 204) {
                        return {};
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        playerCard.remove();
                        updatePlayerCount(-1);
                        displayTemporaryMessage(data.message || 'Jogador excluído com sucesso!', 'success');
                    } else {
                        displayTemporaryMessage(data.error || 'Falha ao excluir o jogador.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Erro ao excluir jogador:', error);
                    displayTemporaryMessage(`Erro de rede ou servidor ao tentar excluir o jogador: ${error.message}`, 'error');
                });
            }
        });
    }

    // --- Gerar Chaves (Lógica futura) ---
    if (generateBracketButton && bracketPlayersList && tournamentId) {
        generateBracketButton.addEventListener('click', function() {
            displayTemporaryMessage('Gerando chaves...', 'info');
            bracketPlayersList.innerHTML = '';

            const noPlayersMessageBracket = bracketPlayersList.querySelector('.no-players-message-bracket');
            if (noPlayersMessageBracket) {
                noPlayersMessageBracket.remove();
            }

            const getPlayersUrl = `/tournament/${tournamentId}/get_player_for_bracket`; 

            fetch(getPlayersUrl, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || 'Erro desconhecido ao buscar jogadores para chaves');
                    }).catch(() => {
                        throw new Error(`Erro de rede ou servidor: Status ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.players && data.players.length > 0) {
                    data.players.forEach((player, index) => {
                        const playerDiv = document.createElement('div');
                        playerDiv.className = 'bracket-player-card';
                        playerDiv.setAttribute('data-player-id', player.id);

                        playerDiv.innerHTML = `
                            <div class="bracket-player-details">
                                <span class="bracket-player-name">${player.name}</span>
                                <span class="bracket-player-rating">Rating: ${player.rating}</span>
                            </div>
                            <div class="bracket-player-number">
                                ${index + 1}
                            </div>
                        `;
                        bracketPlayersList.appendChild(playerDiv);
                    });
                    displayTemporaryMessage('Jogadores carregados para formação de chaves!', 'success');
                } else {
                    displayTemporaryMessage('Nenhum jogador encontrado para formar chaves.', 'info');
                    const newNoPlayersMessage = document.createElement('p');
                    newNoPlayersMessage.className = 'no-players-message-bracket';
                    newNoPlayersMessage.textContent = 'Nenhum jogador para formar chaves ainda.';
                    bracketPlayersList.appendChild(newNoPlayersMessage);
                }
            })
            .catch(error => {
                console.error('Erro ao carregar jogadores para chaves:', error);
                displayTemporaryMessage(`Erro ao carregar jogadores para chaves: ${error.message}`, 'error');
            });
        });
    }

    // --- Inicialização ---
    updatePlayerCount(0); 

    const djangoMessageCloseButtons = document.querySelectorAll('ul.messages .close-message-button');
    if (djangoMessageCloseButtons.length > 0) {
        djangoMessageCloseButtons.forEach(button => {
            button.addEventListener('click', function() {
                const messageLi = this.closest('li');
                if (messageLi) {
                    messageLi.classList.add('hide');
                    messageLi.addEventListener('transitionend', function() {
                        messageLi.remove();
                    }, { once: true });
                }
            });
        });
    }
});