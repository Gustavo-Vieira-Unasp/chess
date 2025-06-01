document.addEventListener('DOMContentLoaded', function() {
    // === Variáveis de Elementos DOM ===
    const tournamentContainer = document.querySelector('.tournament-container');
    const tournamentId = tournamentContainer ? tournamentContainer.dataset.tournamentId : null;

    // Elementos da descrição editável
    const descriptionText = document.getElementById('descriptionText');
    const editButton = document.getElementById('editButton');
    const editableInput = document.getElementById('editableInput');
    const saveForm = document.getElementById('saveForm');
    const saveButton = document.getElementById('saveButton');
    const hiddenDescription = document.getElementById('hiddenDescription'); // Campo hidden para manter o valor original/salvo

    // Elementos do modal de adicionar jogador
    const openAddPlayerModalButton = document.getElementById('openAddPlayerModalButton');
    const addPlayerModal = document.getElementById('addPlayerModal');
    const closeAddPlayerModalButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null;
    const addPlayerForm = document.getElementById('addPlayerForm');
    const playerFormError = document.getElementById('playerFormError');

    // Seção de jogadores (lista principal)
    const playersListContainer = document.querySelector('.players-list-container');
    const numPlayersSpan = document.getElementById('numPlayers');

    // Seção de formação de chaves / Partidas
    const matchesContainer = document.getElementById('matchesContainer'); // Alterado de bracketPlayersList para matchesContainer para consistência
    const generateBracketButton = document.getElementById('generateBracketButton'); // Botão para gerar as partidas

    // Container de mensagens (Django messages)
    const djangoMessagesUl = document.querySelector('ul.messages');

    // === Funções Auxiliares ===

    /**
     * Obtém o token CSRF de um cookie.
     * @param {string} name - O nome do cookie (ex: 'csrftoken').
     * @returns {string|null} O valor do token CSRF ou null se não encontrado.
     */
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    /**
     * Exibe uma mensagem temporária na interface.
     * @param {string} message - O texto da mensagem a ser exibida.
     * @param {string} type - O tipo da mensagem ('success', 'info', 'warning', 'error').
     */
    function displayTemporaryMessage(message, type) {
        let targetContainer = document.querySelector('.messages-container .messages');

        if (!targetContainer) {
            // Se o container de mensagens específico não existe, cria um dinamicamente
            const jsMessagesDiv = document.createElement('ul');
            jsMessagesDiv.id = 'js-messages-container';
            jsMessagesDiv.classList.add('messages');
            jsMessagesDiv.style.marginTop = '15px';
            jsMessagesDiv.style.marginBottom = '15px';
            if (tournamentContainer) {
                tournamentContainer.prepend(jsMessagesDiv);
            } else {
                document.body.prepend(jsMessagesDiv);
            }
            targetContainer = jsMessagesDiv;
        }

        const li = document.createElement('li');
        li.className = type;
        li.innerHTML = `${message} <span class="close-message-button" title="Fechar">&times;</span>`;
        targetContainer.prepend(li); // Adiciona no início para as mais recentes aparecerem primeiro

        // Adiciona event listener para o botão de fechar
        li.querySelector('.close-message-button').addEventListener('click', function() {
            li.classList.add('hide');
            li.addEventListener('transitionend', function() {
                li.remove();
            }, { once: true });
        });

        // Oculta e remove a mensagem após 5 segundos
        setTimeout(() => {
            li.classList.add('hide'); // Adiciona classe para iniciar a transição
            li.addEventListener('transitionend', function() {
                li.remove(); // Remove o elemento após a transição
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
        // Lógica para exibir/ocultar mensagem "sem jogadores"
        const noPlayersMessage = playersListContainer ? playersListContainer.querySelector('.no-players-message') : null;
        if (noPlayersMessage) {
            if (parseInt(numPlayersSpan.textContent) === 0) {
                noPlayersMessage.style.display = 'block';
            } else {
                noPlayersMessage.style.display = 'none';
            }
        }
    }

    /**
     * Renderiza as partidas no container de chaves.
     * @param {Array} matches - Array de objetos de partida.
     * @param {number} roundNumber - Número da rodada atual.
     */
    function renderMatches(matches, roundNumber) {
        if (!matchesContainer) {
            console.error("Elemento 'matchesContainer' não encontrado para renderizar partidas.");
            return;
        }

        let html = `<h4>Rodada ${roundNumber}</h4>`;
        if (matches.length === 0) {
            html += `<p>Nenhuma partida gerada para esta rodada.</p>`;
        } else {
            html += `<div class="matches-grid">`; // Ou use uma tabela, dependendo do seu CSS
            matches.forEach(match => {
                const matchId = match.match_id; // Certifique-se que o backend retorna 'match_id'
                const player1Name = match.player_white_name;
                const player2Name = match.is_bye_match ? 'BYE' : match.player_black_name;
                
                let resultDisplay = 'Aguardando';
                if (match.is_bye_match) {
                    resultDisplay = 'BYE';
                } else {
                    switch (match.result) {
                        case 'W': resultDisplay = `${player1Name} Vence`; break;
                        case 'B': resultDisplay = `${player2Name} Vence`; break;
                        case 'D': resultDisplay = 'Empate'; break;
                        default: resultDisplay = 'Aguardando'; break;
                    }
                }
                
                html += `
                    <div class="match-card" data-match-id="${matchId}">
                        <div class="match-header">Partida ${match.match_number}</div>
                        <div class="match-players">
                            <div class="player-name-match white-player">${player1Name}</div>
                            <div class="vs-separator">vs</div>
                            <div class="player-name-match black-player">${player2Name}</div>
                        </div>
                        <div class="match-result-display" id="match-result-${matchId}">${resultDisplay}</div>
                        ${!match.is_bye_match ? `
                            <div class="match-actions">
                                <button type="button" class="btn btn-sm btn-success register-result-btn" data-match-id="${matchId}" data-result="W">Brancas</button>
                                <button type="button" class="btn btn-sm btn-dark register-result-btn" data-match-id="${matchId}" data-result="B">Pretas</button>
                                <button type="button" class="btn btn-sm btn-info register-result-btn" data-match-id="${matchId}" data-result="D">Empate</button>
                            </div>`
                        : ''}
                    </div>
                `;
            });
            html += `</div>`;
        }
        matchesContainer.innerHTML = html;

        // Adicionar event listeners para os botões de registro de resultado
        document.querySelectorAll('.register-result-btn').forEach(button => {
            button.addEventListener('click', handleRegisterResult);
        });
    }

    // Função para atualizar o score de um jogador na UI (card do jogador)
    function updatePlayerScoreInUI(playerId, newScore) {
        const playerCard = document.querySelector(`.player-card[data-player-id="${playerId}"]`);
        if (playerCard) {
            const scoreSpan = playerCard.querySelector('.player-score'); // Assumindo que você tem um span com a classe 'player-score' dentro do player-card
            if (scoreSpan) {
                scoreSpan.textContent = newScore;
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

            if (hiddenDescription.value.trim() === "Edite a descrição do torneio aqui...") {
                editableInput.value = '';
            } else {
                editableInput.value = hiddenDescription.value.trim();
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
            if (descriptionText.textContent.trim() === "") {
                descriptionText.textContent = "Edite a descrição do torneio aqui...";
            }
        }

        hideEditableDescription();

        editButton.addEventListener('click', showEditableDescription);
        descriptionText.addEventListener('click', showEditableDescription);

        saveForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const newDescription = editableInput.value.trim();
            // Atualiza o hiddenDescription imediatamente para refletir a mudança pendente
            hiddenDescription.value = newDescription || "Edite a descrição do torneio aqui...";

            const formData = new FormData();
            formData.append('description', newDescription); // Apenas a descrição, o CSRF será adicionado via headers

            try {
                const response = await fetch(this.action, { // Usar this.action para pegar a URL do form
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': csrftoken, // Adiciona o CSRF aqui para FormData
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.success) {
                        hiddenDescription.value = data.description;
                        descriptionText.textContent = data.description;
                        hideEditableDescription();
                        displayTemporaryMessage('Descrição atualizada com sucesso!', 'success');
                    } else {
                        displayTemporaryMessage(data.error || 'Falha ao atualizar a descrição.', 'error');
                    }
                } else {
                    // Erro HTTP (ex: 400, 500)
                    const errorMsg = data.error || `Erro HTTP: ${response.status}.`;
                    displayTemporaryMessage(errorMsg, 'error');
                    console.error('Erro de servidor ao salvar descrição:', data);
                }
            } catch (error) {
                console.error('Erro de rede ou JSON ao salvar descrição:', error);
                displayTemporaryMessage(`Erro de conexão ou servidor ao salvar descrição: ${error.message}`, 'error');
            }
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
    if (openAddPlayerModalButton && addPlayerModal && closeAddPlayerModalButton && addPlayerForm && playerFormError && tournamentId) {
        openAddPlayerModalButton.addEventListener('click', function() {
            addPlayerModal.style.display = 'flex';
            playerFormError.textContent = '';
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

        // NOVO: Adiciona funcionalidade da tecla ESC para fechar o modal
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && addPlayerModal.style.display === 'flex') {
                addPlayerModal.style.display = 'none';
                event.preventDefault();
            }
        });


        addPlayerForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const playerNameInput = document.getElementById('id_name');
            const playerName = playerNameInput.value.trim();

            playerFormError.textContent = '';
            playerFormError.style.display = 'none';

            if (!playerName) {
                const msg = 'O nome do jogador não pode ser vazio.';
                playerFormError.textContent = msg;
                playerFormError.style.display = 'block';
                displayTemporaryMessage(msg, 'error');
                return;
            }

            const formData = new FormData(addPlayerForm);
            // CSRF token já está no formData se o seu formulário Django o incluir
            // Se não, adicione: formData.append('csrfmiddlewaretoken', csrftoken);

            try {
                const response = await fetch(`/simple_tournament/tournament/${tournamentId}/add_player/`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.success) {
                        addPlayerModal.style.display = 'none';
                        addPlayerForm.reset();

                        const newPlayerCardHTML = `
                            <div class="player-card" data-player-id="${data.player.id}">
                                <span class="player-name">${data.player.name}</span>
                                <span class="player-score">${data.player.score}</span> <div class="delete-player-option" title="Excluir jogador">
                                    <form action="/simple_tournament/tournament/${tournamentId}/delete_player/${data.player.id}/" method="POST" style="display: inline;">
                                        <input type="hidden" name="csrfmiddlewaretoken" value="${csrftoken}">
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
                            // Fallback se .players-grid não existe, insere diretamente no playersListContainer.
                            playersListContainer.insertAdjacentHTML('beforeend', newPlayerCardHTML);
                        }
                        updatePlayerCount(1);
                        displayTemporaryMessage(data.message || 'Jogador adicionado com sucesso!', 'success');
                    } else {
                        let errorMessage = data.message || 'Erro inesperado ao adicionar jogador.';
                        if (data.errors) {
                            for (const field in data.errors) {
                                if (data.errors.hasOwnProperty(field)) {
                                    errorMessage += ` ${field.charAt(0).toUpperCase() + field.slice(1)}: ${data.errors[field].join(' ')}`;
                                }
                            }
                        }
                        playerFormError.textContent = errorMessage;
                        playerFormError.style.display = 'block';
                        displayTemporaryMessage(errorMessage, 'error');
                    }
                } else {
                    let errorMessage = data.message || `Erro HTTP: ${response.status}.`;
                    if (data.errors) {
                        if (data.errors.name && data.errors.name.length > 0) {
                            errorMessage = data.errors.name.join(' ');
                        } else {
                            for (const field in data.errors) {
                                if (data.errors.hasOwnProperty(field)) {
                                    errorMessage += ` ${field.charAt(0).toUpperCase() + field.slice(1)}: ${data.errors[field].join(' ')}`;
                                }
                            }
                        }
                    }
                    playerFormError.textContent = errorMessage;
                    playerFormError.style.display = 'block';
                    displayTemporaryMessage(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Erro de rede ou JSON ao adicionar jogador:', error);
                playerFormError.textContent = `Erro de conexão ou servidor. Tente novamente. Detalhes: ${error.message}`;
                playerFormError.style.display = 'block';
                displayTemporaryMessage(`Erro: ${error.message}`, 'error');
            }
        });
    }

    // --- Exclusão de Jogador ---
    if (playersListContainer) {
        playersListContainer.addEventListener('click', async function(event) {
            const deleteButton = event.target.closest('.delete-player-button');
            if (deleteButton) {
                event.preventDefault(); // Impede o envio do formulário HTML padrão
                event.stopPropagation(); // Impede a propagação do clique

                const playerCard = deleteButton.closest('.player-card');
                const playerId = playerCard.dataset.playerId;
                const playerNameElement = playerCard.querySelector('.player-name');
                const playerName = playerNameElement ? playerNameElement.textContent : `ID ${playerId}`;

                if (confirm(`Tem certeza que deseja excluir o jogador '${playerName}'?`)) {
                    const form = deleteButton.closest('form');
                    const url = form.action; // Pega a URL do atributo 'action' do formulário
                    // const csrfToken = form.querySelector('input[name="csrfmiddlewaretoken"]').value; // Já temos csrftoken global

                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': csrftoken,
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                        });

                        if (response.status === 204) { // 204 No Content para exclusão bem-sucedida sem corpo
                            playerCard.remove();
                            updatePlayerCount(-1);
                            displayTemporaryMessage('Jogador excluído com sucesso!', 'success');
                            return; // Sai da função
                        }

                        const data = await response.json(); // Se não for 204, assume que tem um JSON

                        if (response.ok) {
                            if (data.success) {
                                playerCard.remove();
                                updatePlayerCount(-1);
                                displayTemporaryMessage(data.message || 'Jogador excluído com sucesso!', 'success');
                            } else {
                                displayTemporaryMessage(data.message || 'Falha ao excluir o jogador.', 'error');
                            }
                        } else {
                            let errorMessage = data.message || `Erro HTTP: ${response.status}.`;
                            if (data.errors && data.errors.detail) {
                                errorMessage = data.errors.detail;
                            } else if (data.error) {
                                errorMessage = data.error;
                            }
                            displayTemporaryMessage(errorMessage, 'error');
                        }

                    } catch (error) {
                        console.error('Erro ao excluir jogador:', error);
                        displayTemporaryMessage(`Erro de rede ou servidor ao tentar excluir o jogador: ${error.message}`, 'error');
                    }
                }
            }
        });
    }

    // --- Gerar Chaves (AGORA GERA PAREAMENTOS REAIS) ---
    if (generateBracketButton && matchesContainer && tournamentId) {
        generateBracketButton.addEventListener('click', async function() {
            displayTemporaryMessage('Gerando partidas...', 'info');
            matchesContainer.innerHTML = ''; // Limpa as partidas anteriores

            // CORREÇÃO AQUI: Use a URL correta para a sua view de geração de partidas
            // Se você quer a primeira rodada aleatória:
            const generateMatchesUrl = `/simple_tournament/tournament/${tournamentId}/generate_random_pairings/`;
            // Se você quer a geração de rodada suíça (para rodadas subsequentes):
            // const generateMatchesUrl = `/simple_tournament/tournament/${tournamentId}/generate_round/`;

            try {
                const response = await fetch(generateMatchesUrl, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json', // Importante para o backend
                    },
                    body: JSON.stringify({}) // Envia um corpo vazio, mas no formato JSON
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorMsg = data.message || data.error || `Erro HTTP: ${response.status}.`;
                    throw new Error(errorMsg);
                }

                if (data.success && data.pairings && data.pairings.length > 0) {
                    renderMatches(data.pairings, data.round_number); // Chama a função para renderizar
                    displayTemporaryMessage(data.message || 'Partidas geradas com sucesso!', 'success');
                } else if (data.message) { // Se não houver partidas, mas houver uma mensagem (ex: "poucos jogadores")
                    displayTemporaryMessage(data.message, 'info');
                    const infoMessage = document.createElement('p');
                    infoMessage.className = 'no-matches-message'; // Melhor nome de classe
                    infoMessage.textContent = data.message;
                    matchesContainer.appendChild(infoMessage);
                } else {
                    displayTemporaryMessage('Nenhuma partida gerada. Adicione mais jogadores.', 'info');
                    const newNoMatchesMessage = document.createElement('p');
                    newNoMatchesMessage.className = 'no-matches-message'; // Melhor nome de classe
                    newNoMatchesMessage.textContent = 'Nenhuma partida gerada ainda. Adicione mais jogadores.';
                    matchesContainer.appendChild(newNoMatchesMessage);
                }
            } catch (error) {
                console.error('Erro ao gerar partidas:', error);
                displayTemporaryMessage(`Erro ao gerar partidas: ${error.message}`, 'error');
            }
        });
    }

    // --- Registrar Resultado da Partida ---
    // Adicionado um event listener delegado ao container pai para lidar com cliques nos botões de resultado
    if (matchesContainer) {
        matchesContainer.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('.register-result-btn');
            if (targetButton) {
                const matchId = targetButton.dataset.matchId;
                const result = targetButton.dataset.result;
                
                try {
                    const response = await fetch(`/simple_tournament/tournament/${tournamentId}/match/${matchId}/register_result/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify({ result: result })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        const errorMsg = data.message || data.error || `Erro HTTP: ${response.status}.`;
                        throw new Error(errorMsg);
                    }

                    if (data.success) {
                        displayTemporaryMessage(data.message || 'Resultado registrado com sucesso!', 'success');
                        
                        // Atualizar o display do resultado na UI
                        const resultDisplayElement = document.getElementById(`match-result-${matchId}`);
                        if (resultDisplayElement) {
                            let displayResultText = '';
                            switch(result) {
                                case 'W': displayResultText = `${data.player_white_name} Vence`; break;
                                case 'B': displayResultText = `${data.player_black_name} Vence`; break;
                                case 'D': displayResultText = 'Empate'; break;
                                default: displayResultText = 'Aguardando'; break;
                            }
                            resultDisplayElement.textContent = displayResultText;
                        }

                        // Atualizar os scores dos jogadores (se a sua view retornar scores atualizados)
                        if (data.updated_players) {
                            data.updated_players.forEach(player => {
                                updatePlayerScoreInUI(player.id, player.score);
                            });
                        }
                        
                    } else {
                        displayTemporaryMessage(data.error || data.message || 'Falha ao registrar resultado.', 'error');
                    }

                } catch (error) {
                    console.error('Erro ao registrar resultado:', error);
                    displayTemporaryMessage(`Erro ao registrar resultado: ${error.message}`, 'error');
                }
            }
        });
    }


    // --- Inicialização ---
    // Garante que a mensagem de "sem jogadores" seja exibida se a lista estiver vazia ao carregar.
    updatePlayerCount(0);

    // Esconde as mensagens do Django após um tempo
    if (djangoMessagesUl) {
        setTimeout(() => {
            Array.from(djangoMessagesUl.children).forEach(li => {
                li.classList.add('hide');
                li.addEventListener('transitionend', function() {
                    li.remove();
                }, { once: true });
            });
        }, 5000); // 5 segundos
    }

    // Adiciona event listeners para os botões de fechar mensagens Django já existentes
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

    // --- (OPCIONAL) Carregar partidas existentes ao carregar a página ---
    // Se você quiser que as partidas geradas anteriormente apareçam ao carregar a página,
    // você precisará fazer uma requisição GET para buscar as partidas atuais
    // e chamar `renderMatches` com esses dados.
    // Isso pode ser feito ao carregar a página ou no 'DOMContentLoaded'
    async function loadCurrentMatches() {
        if (!tournamentId || !matchesContainer) return;
        try {
            const response = await fetch(`/simple_tournament/tournament/${tournamentId}/get_current_matches/`); // VOCÊ PRECISARÁ CRIAR ESTA VIEW/URL
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success && data.matches) {
                renderMatches(data.matches, data.round_number || 1); // Assumindo round_number 1 se não retornado
            } else {
                matchesContainer.innerHTML = '<p class="no-matches-message">Nenhuma partida gerada ainda.</p>';
            }
        } catch (error) {
            console.error("Erro ao carregar partidas existentes:", error);
            matchesContainer.innerHTML = `<p class="no-matches-message text-danger">Erro ao carregar partidas: ${error.message}</p>`;
        }
    }
    // loadCurrentMatches(); // Descomente esta linha e crie a view `get_current_matches` no Django se precisar

});