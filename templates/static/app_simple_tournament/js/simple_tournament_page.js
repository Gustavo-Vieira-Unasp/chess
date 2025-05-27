document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript 'simple_tournament_page.js' carregado e DOM content carregado.");

    // --- Lógica para Edição de Descrição do Torneio ---
    const descriptionText = document.getElementById('descriptionText');
    const editButton = document.getElementById('editButton');
    const editableInput = document.getElementById('editableInput');
    const saveButton = document.getElementById('saveButton');
    const hiddenDescription = document.getElementById('hiddenDescription');
    const saveForm = document.getElementById('saveForm'); // Formulário de salvamento

    if (descriptionText && editButton && editableInput && saveButton && hiddenDescription && saveForm) {
        console.log("DEBUG: Elementos de edição da descrição encontrados.");

        descriptionText.addEventListener('click', function() {
            descriptionText.style.display = 'none';
            editButton.style.display = 'none';
            editableInput.value = descriptionText.innerText.trim();
            editableInput.style.display = 'block';
            saveButton.style.display = 'block';
            editableInput.focus();
            console.log("DEBUG: Modo de edição da descrição ativado.");
        });

        editButton.addEventListener('click', function() {
            descriptionText.style.display = 'none';
            editButton.style.display = 'none';
            editableInput.value = descriptionText.innerText.trim();
            editableInput.style.display = 'block';
            saveButton.style.display = 'block';
            editableInput.focus();
            console.log("DEBUG: Modo de edição da descrição ativado (via botão).");
        });

        saveButton.addEventListener('click', function() {
            hiddenDescription.value = editableInput.value.trim();
            saveForm.submit(); // Envia o formulário
            console.log("DEBUG: Formulário de descrição submetido.");
        });

        // Adicionado listener ESC para o input de descrição
        editableInput.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' || event.key === 'Esc') {
                console.log("DEBUG: Tecla ESC pressionada no input de descrição. Fechando edição.");
                // Reverte para o texto original antes de esconder
                editableInput.value = descriptionText.innerText.trim(); 
                editableInput.style.display = 'none';
                saveButton.style.display = 'none';
                descriptionText.style.display = 'block';
                editButton.style.display = 'block';
                event.preventDefault(); // Impede qualquer comportamento padrão do ESC no textarea
            } 
            // *** NOVO: Salvar ao pressionar Ctrl + Enter / Cmd + Enter ***
            else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { // event.metaKey para Cmd no Mac
                console.log("DEBUG: Ctrl/Cmd + Enter pressionado no input de descrição. Salvando...");
                hiddenDescription.value = editableInput.value.trim();
                saveForm.submit();
                event.preventDefault(); // Impede que uma nova linha seja inserida no textarea
            }
        });

        document.addEventListener('click', function(event) {
            if (!descriptionText.contains(event.target) && !editButton.contains(event.target) &&
                !editableInput.contains(event.target) && !saveButton.contains(event.target) &&
                editableInput.style.display === 'block') {
                
                editableInput.style.display = 'none';
                saveButton.style.display = 'none';
                descriptionText.style.display = 'block';
                editButton.style.display = 'block';
                console.log("DEBUG: Clique fora, modo de edição da descrição desativado.");
            }
        });
    } else {
        console.warn("AVISO: Elementos de edição da descrição não encontrados. Funções de edição desativadas.");
    }

    // --- Lógica do Modal "Adicionar Jogador" ---
    const addPlayerModal = document.getElementById('addPlayerModal');
    const openAddPlayerModalButton = document.getElementById('openAddPlayerModalButton');
    const closeButton = document.querySelector('#addPlayerModal .close-button');
    const addPlayerForm = document.getElementById('addPlayerForm');
    const playerNameInput = document.getElementById('id_name');
    const playerFormError = document.getElementById('playerFormError');
    const tournamentContainer = document.querySelector('.tournament-container');
    let tournamentId = null;

    if (tournamentContainer) {
        tournamentId = tournamentContainer.dataset.tournamentId;
        console.log('DEBUG: Tournament ID obtido:', tournamentId);
    } else {
        console.error('ERRO: Elemento .tournament-container não encontrado no DOM!');
    }

    if (openAddPlayerModalButton && addPlayerModal && closeButton && addPlayerForm && playerNameInput && playerFormError && tournamentId) {
        console.log('DEBUG: Todos os elementos do modal e tournamentId foram encontrados. Modal deve funcionar corretamente.');

        openAddPlayerModalButton.addEventListener('click', function() {
            console.log('DEBUG: Botão "Adicionar Novo Jogador" clicado. Abrindo modal.');
            addPlayerModal.style.display = 'flex';
            addPlayerModal.classList.add('show');
            playerNameInput.focus();
        });

        closeButton.addEventListener('click', function() {
            console.log('DEBUG: Botão "Fechar Modal" clicado. Fechando modal.');
            addPlayerModal.classList.remove('show');
            setTimeout(() => {
                addPlayerModal.style.display = 'none';
                playerFormError.style.display = 'none';
                playerNameInput.value = '';
            }, 300);
        });

        window.addEventListener('click', function(event) {
            if (event.target == addPlayerModal) {
                console.log("DEBUG: Clique FORA do modal. Fechando modal.");
                addPlayerModal.classList.remove('show');
                setTimeout(() => {
                    addPlayerModal.style.display = 'none';
                    playerFormError.style.display = 'none';
                    playerNameInput.value = '';
                }, 300);
            }
        });

        document.addEventListener('keydown', function(event) {
            // Verifica se o foco NÃO está no editableInput da descrição
            // para que o ESC feche o modal e não o campo de descrição.
            if ((event.key === 'Escape' || event.key === 'Esc') && editableInput !== document.activeElement) { 
                if (addPlayerModal.classList.contains('show')) {
                    console.log("DEBUG: Tecla ESC pressionada. Fechando modal.");
                    addPlayerModal.classList.remove('show');
                    setTimeout(() => { addPlayerModal.style.display = 'none'; }, 300);
                }
            }
        });


        // Lógica para submissão do formulário de adicionar jogador via AJAX
        addPlayerForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão do formulário
            console.log('DEBUG: Formulário de adicionar jogador submetido via AJAX.');

            const playerName = playerNameInput.value.trim();
            if (!playerName) {
                playerFormError.innerText = 'O nome do jogador não pode estar vazio.';
                playerFormError.style.display = 'block';
                console.log('DEBUG: Nome do jogador vazio. Exibindo erro.');
                return;
            }

            // Define a URL de ação do formulário dinamicamente
            addPlayerForm.action = `/simple_tournament/tournament/${tournamentId}/add_player/`;
            console.log('DEBUG: URL de ação do formulário AJAX:', addPlayerForm.action);

            fetch(addPlayerForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: new URLSearchParams({
                    'name': playerName
                })
            })
            .then(response => {
                console.log('DEBUG: Resposta da requisição AJAX de adicionar jogador recebida. Status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => { 
                        console.error("ERRO AJAX DETECTADO. Resposta do servidor (não JSON):", text);
                        throw new Error(`Erro do servidor (${response.status}): ${text.substring(0, 100)}... (ver console para resposta completa)`); 
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log('DEBUG: Jogador adicionado com sucesso:', data.player.name);

                    const playersListContainer = document.querySelector('.players-list-container');
                    const noPlayersMessage = document.querySelector('.no-players-message');

                    if (noPlayersMessage) {
                        noPlayersMessage.remove();
                        console.log("DEBUG: Mensagem 'Nenhum jogador' removida.");
                    }

                    const newPlayerCard = document.createElement('div');
                    newPlayerCard.classList.add('player-card');
                    newPlayerCard.dataset.playerId = data.player.id;
                    newPlayerCard.innerHTML = `
                        <span class="player-name">${data.player.name}</span>
                        <div class="delete-player-option" title="Excluir jogador">
                            <form action="/simple_tournament/tournament/${tournamentId}/delete_player/${data.player.id}/" method="POST" style="display: inline;">
                                <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
                                <button type="submit" class="delete-player-button" role="button" tabindex="0" aria-label="Excluir jogador">
                                    <i class='bx bx-trash'></i>
                                </button>
                            </form>
                        </div>
                        <div class="player-number-box">
                            <span class="player-number">${data.player.rating || "0"}</span>
                        </div>
                    `;
                    playersListContainer.appendChild(newPlayerCard);
                    console.log(`DEBUG: Card do jogador ${data.player.name} adicionado ao DOM.`);

                    addPlayerModal.classList.remove('show');
                    setTimeout(() => {
                        addPlayerModal.style.display = 'none';
                        playerFormError.style.display = 'none';
                        playerNameInput.value = '';
                        console.log("DEBUG: Modal de adicionar jogador fechado e formulário limpo.");
                    }, 300);

                    console.log(`SUCESSO: ${data.message}`);

                } else {
                    let errorMessage = data.message || 'Ocorreu um erro ao adicionar o jogador.';
                    if (data.errors) {
                         try {
                            const parsedErrors = JSON.parse(data.errors);
                            if (parsedErrors.__all__ && parsedErrors.__all__.length > 0) {
                                errorMessage += ' ' + parsedErrors.__all__[0].message;
                            } else if (parsedErrors.name && parsedErrors.name.length > 0) {
                                errorMessage += ' ' + parsedErrors.name[0].message;
                            }
                        } catch (e) {
                            console.warn("Não foi possível parsear os erros JSON do formulário:", data.errors, e);
                            errorMessage += ' Detalhes do erro: ' + data.errors;
                        }
                    }
                    playerFormError.innerText = errorMessage;
                    playerFormError.style.display = 'block';
                    console.log('DEBUG: Erro ao adicionar jogador:', data.message, data.errors);
                }
            })
            .catch(error => {
                console.error('ERRO: Falha na requisição AJAX de adicionar jogador:', error);
                playerFormError.innerText = error.message || 'Erro na rede ou servidor.';
                playerFormError.style.display = 'block';
            });
        });
    } else {
        console.error('ERRO: Um ou mais elementos do modal de jogador não foram encontrados no DOM ou tournamentId está ausente. As funções de modal/adição de jogador não funcionarão.');
        console.log({
            openAddPlayerModalButton_exists: !!openAddPlayerModalButton,
            addPlayerModal_exists: !!addPlayerModal,
            closeButton_exists: !!closeButton,
            addPlayerForm_exists: !!addPlayerForm,
            playerNameInput_exists: !!playerNameInput,
            playerFormError_exists: !!playerFormError,
            tournamentId_exists: !!tournamentId,
            tournamentId_value: tournamentId
        });
    }

    // --- Lógica para Excluir Jogador (delegação de eventos) ---
    const playersSection = document.querySelector('.players-section'); 

    if (playersSection) {
        console.log("DEBUG: Elemento .players-section encontrado para delegação de exclusão.");
        playersSection.addEventListener('click', function(event) {
            const target = event.target;
            const deleteButton = target.closest('.delete-player-button');
            
            if (deleteButton) {
                event.preventDefault(); // Impede o envio padrão do formulário via HTML
                console.log('DEBUG: Botão de exclusão de jogador clicado.');

                const playerCard = deleteButton.closest('.player-card');
                if (!playerCard) {
                    console.error('ERRO: player-card não encontrado para o botão de exclusão. A estrutura HTML do card pode estar incorreta.');
                    return;
                }

                const playerId = playerCard.dataset.playerId;
                const currentTournamentId = tournamentId; 

                if (!currentTournamentId) {
                    console.error('ERRO: Tournament ID não disponível para exclusão de jogador.');
                    return;
                }

                if (confirm(`Tem certeza que deseja excluir o jogador?`)) {
                    const form = deleteButton.closest('form');
                    if (form) {
                        form.action = `/simple_tournament/tournament/${currentTournamentId}/delete_player/${playerId}/`;
                        console.log('DEBUG: Enviando formulário de exclusão para:', form.action);
                        form.submit(); // Isso fará uma requisição POST e deve redirecionar
                    } else {
                        console.error('ERRO: Formulário de exclusão não encontrado para o botão de exclusão.');
                    }
                }
            }
        });
    } else {
        console.error('ERRO: Elemento .players-section não encontrado no DOM. Delegação de exclusão de jogadores não ativada.');
    }


    // --- Função auxiliar para obter o CSRF token ---
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

    // --- Lógica para esconder mensagens flash após um tempo ---
    const messagesContainer = document.querySelector('.messages');
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.style.opacity = '0';
            messagesContainer.style.transition = 'opacity 1s ease-out';
            setTimeout(() => {
                messagesContainer.style.display = 'none';
            }, 1000);
        }, 5000);
    }
});