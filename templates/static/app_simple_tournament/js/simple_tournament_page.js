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
    const hiddenDescription = document.getElementById('hiddenDescription');

    // Elementos do modal de adicionar jogador
    const openAddPlayerModalButton = document.getElementById('openAddPlayerModalButton');
    const addPlayerModal = document.getElementById('addPlayerModal');
    const closeAddPlayerModalButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null;
    const addPlayerForm = document.getElementById('addPlayerForm');
    const playerFormError = document.getElementById('playerFormError');

    // Seção de jogadores
    const playersListContainer = document.querySelector('.players-list-container');
    const numPlayersSpan = document.getElementById('numPlayers');

    // Seção de formação de chaves
    const bracketPlayersList = document.getElementById('bracketPlayersList');
    const generateBracketButton = document.getElementById('generateBracketButton');


    // === Funções Auxiliares ===

    /**
     * Exibe uma mensagem temporária na interface.
     * @param {string} message - O texto da mensagem a ser exibida.
     * @param {string} type - O tipo da mensagem ('success', 'info', 'warning', 'error').
     */
    function displayTemporaryMessage(message, type) {
        const messagesContainer = document.querySelector('.messages');
        if (!messagesContainer) {
            console.warn('Container de mensagens .messages não encontrado. Mensagem não exibida.');
            // Fallback: usar alert() se o container não existir
            return;
        }

        const li = document.createElement('li');
        li.className = type; // Adiciona a classe de tipo para estilização (success, error, etc.)
        li.innerHTML = `${message} <span class="close-message-button" title="Fechar">&times;</span>`;
        messagesContainer.prepend(li); // Adiciona a mensagem no início da lista

        // Adiciona listener para o botão de fechar
        li.querySelector('.close-message-button').addEventListener('click', function() {
            li.classList.add('hide'); // Inicia a transição de saída
            li.addEventListener('transitionend', function() {
                li.remove(); // Remove o elemento após a transição
            }, { once: true });
        });

        // Remove a mensagem automaticamente após 5 segundos
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
                numPlayersSpan.textContent = Math.max(0, currentCount + change); // Garante que não seja negativo
            }
        }
        // Lógica para mostrar/esconder a mensagem "Nenhum jogador"
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
        // Exibir textarea e botão salvar ao clicar em "Editar" ou no texto
        editButton.addEventListener('click', function() {
            descriptionText.style.display = 'none';
            editButton.style.display = 'none';
            editableInput.style.display = 'block';
            saveButton.style.display = 'block';
            editableInput.value = descriptionText.textContent.trim(); // Popula com o texto atual
            editableInput.focus();
        });

        descriptionText.addEventListener('click', function() {
            if (descriptionText.textContent.trim() === "Edite a descrição do torneio aqui...") {
                 editableInput.value = ''; // Limpa se for o texto placeholder
            } else {
                editableInput.value = descriptionText.textContent.trim(); // Popula com o texto atual
            }
            descriptionText.style.display = 'none';
            editButton.style.display = 'none';
            editableInput.style.display = 'block';
            saveButton.style.display = 'block';
            editableInput.focus();
        });

        // Salvar descrição via AJAX
        saveForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão do formulário

            const newDescription = editableInput.value.trim();
            hiddenDescription.value = newDescription; // Atualiza o campo hidden com o novo valor

            const formData = new FormData(saveForm); // Pega os dados do formulário, incluindo o CSRF token

            fetch(saveForm.action, {
                method: 'POST',
                body: formData, // FormData já lida com o Content-Type e CSRF
                headers: {
                    'X-Requested-With': 'XMLHttpRequest', // Indica que é uma requisição AJAX
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
                    descriptionText.textContent = data.description; // Atualiza o texto exibido
                    descriptionText.style.display = 'block';
                    editButton.style.display = 'block';
                    editableInput.style.display = 'none';
                    saveButton.style.display = 'none';
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
    }

    // --- Modal de Adicionar Jogador ---
    if (openAddPlayerModalButton && addPlayerModal && closeAddPlayerModalButton && addPlayerForm && playerFormError) {
        openAddPlayerModalButton.addEventListener('click', function() {
            addPlayerModal.style.display = 'flex'; // Usar flex para centralizar
            playerFormError.style.display = 'none'; // Esconde erros anteriores
            addPlayerForm.reset(); // Limpa o formulário
        });

        closeAddPlayerModalButton.addEventListener('click', function() {
            addPlayerModal.style.display = 'none';
        });

        // Fechar modal clicando fora
        window.addEventListener('click', function(event) {
            if (event.target == addPlayerModal) {
                addPlayerModal.style.display = 'none';
            }
        });

        // Adicionar jogador via AJAX
        addPlayerForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão do formulário

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
                    // Adicionar o novo card de jogador ao DOM
                    const newPlayerCardHTML = `
                        <div class="player-card" data-player-id="${data.player.id}">
                            <span class="player-name">${data.player.name}</span>
                            <div class="delete-player-option" title="Excluir jogador">
                                <form action="/tournaments/${tournamentId}/players/${data.player.id}/delete/" method="POST" style="display: inline;">
                                    <input type="hidden" name="csrfmiddlewaretoken" value="${data.csrf_token}">
                                    <button type="submit" class="delete-player-button" role="button" tabindex="0" aria-label="Excluir jogador">
                                        <i class='bx bx-trash'></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    `;
                    playersListContainer.insertAdjacentHTML('beforeend', newPlayerCardHTML);
                    updatePlayerCount(1); // Incrementa a contagem
                    displayTemporaryMessage('Jogador adicionado com sucesso!', 'success');
                    addPlayerModal.style.display = 'none'; // Fecha o modal
                    addPlayerForm.reset(); // Limpa o formulário

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
        // Usar delegação de eventos para botões de exclusão que serão adicionados dinamicamente
        playersListContainer.addEventListener('click', function(event) {
            const deleteButton = event.target.closest('.delete-player-button');
            if (deleteButton) {
                event.preventDefault(); // Impede o envio padrão do formulário (redirecionamento)

                const playerCard = deleteButton.closest('.player-card');
                const playerId = playerCard.dataset.playerId;
                // tournamentId já está definido globalmente no escopo do DOMContentLoaded

                const form = deleteButton.closest('form');
                const url = form.action; // Pega a URL do atributo action do formulário
                const csrfToken = form.querySelector('input[name="csrfmiddlewaretoken"]').value;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        // 'Content-Type': 'application/json' // Não é necessário se você estiver enviando apenas o CSRF no corpo
                    },
                    // Se sua view de exclusão espera um JSON no corpo, use:
                    // body: JSON.stringify({ player_id: playerId })
                    // Caso contrário, apenas envie o POST com o CSRF no header.
                })
                .then(response => {
                    // PRIMEIRA VERIFICAÇÃO: Checar se a resposta foi bem-sucedida (status 2xx)
                    if (!response.ok) {
                        // Se o status não for 2xx, tenta ler a mensagem de erro do servidor
                        return response.json().then(errorData => {
                            throw new Error(errorData.error || 'Erro desconhecido do servidor');
                        }).catch(() => {
                            // Se não for JSON ou a leitura falhar, joga um erro genérico
                            throw new Error(`Erro no servidor: Status ${response.status}`);
                        });
                    }
                    // Se o status for 204 (No Content), não há corpo JSON para ler, retorna objeto vazio
                    if (response.status === 204) {
                        return {};
                    }
                    // Para outros status 2xx (como 200 OK), tenta ler como JSON
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        playerCard.remove(); // Remove o card do DOM
                        updatePlayerCount(-1); // Decrementa a contagem de jogadores
                        displayTemporaryMessage(data.message || 'Jogador excluído com sucesso!', 'success');
                    } else {
                        // Caso a resposta JSON indique falha (ex: {"success": false, "error": "msg"})
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
    if (generateBracketButton && bracketPlayersList) {
        generateBracketButton.addEventListener('click', function() {
            // Lógica para gerar chaves (será implementada aqui ou em outra função)
            // Por enquanto, apenas um placeholder:
            displayTemporaryMessage('Funcionalidade de geração de chaves em desenvolvimento!', 'info');
            console.log('Botão Gerar Chaves clicado!');
            // Exemplo de como você popularia a lista de chaves:
            // bracketPlayersList.innerHTML = ''; // Limpa a lista atual
            // Sua lógica aqui para adicionar jogadores e partidas
            // Ex: fetch('/api/generate-bracket/', {method: 'POST', ...})
            // .then(response => response.json())
            // .then(data => {
            //     data.players.forEach(player => {
            //         const playerDiv = document.createElement('div');
            //         playerDiv.className = 'bracket-player-card';
            //         playerDiv.innerHTML = `<span class="bracket-player-name">${player.name}</span>`;
            //         bracketPlayersList.appendChild(playerDiv);
            //     });
            //     // Esconde a mensagem "Nenhum jogador" se houver jogadores
            //     const noPlayersMessageBracket = bracketPlayersList.querySelector('.no-players-message-bracket');
            //     if (noPlayersMessageBracket) noPlayersMessageBracket.style.display = 'none';
            // });
        });
    }

    // --- Inicialização ---
    // Chama updatePlayerCount no carregamento para garantir que a mensagem 'Nenhum jogador' esteja correta
    updatePlayerCount(0); // Passa 0 para apenas ler e ajustar, não alterar a contagem inicial

    // Adiciona o listener para fechar mensagens existentes do Django ao carregar a página
    document.querySelectorAll('.messages .close-message-button').forEach(button => {
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
});