document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript 'simple_tournament_page.js' carregado e DOM content carregado.");

    // --- Lógica para Edição de Descrição do Torneio ---
    const descriptionText = document.getElementById('descriptionText');
    const editButton = document.getElementById('editButton');
    const editableInput = document.getElementById('editableInput');
    const saveButton = document.getElementById('saveButton');
    const hiddenDescription = document.getElementById('hiddenDescription');
    const saveForm = document.getElementById('saveForm');

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
            saveForm.submit();
            console.log("DEBUG: Formulário de descrição submetido.");
        });

        editableInput.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' || event.key === 'Esc') {
                console.log("DEBUG: Tecla ESC pressionada no input de descrição. Fechando edição.");
                editableInput.value = descriptionText.innerText.trim();
                editableInput.style.display = 'none';
                saveButton.style.display = 'none';
                descriptionText.style.display = 'block';
                editButton.style.display = 'block';
                event.preventDefault();
            } 
            else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                console.log("DEBUG: Ctrl/Cmd + Enter pressionado no input de descrição. Salvando...");
                hiddenDescription.value = editableInput.value.trim();
                saveForm.submit();
                event.preventDefault();
            }
        });

        document.addEventListener('click', function(event) {
            // Verifica se o clique foi fora dos elementos de edição da descrição
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

    // NOVO: Referências aos elementos de estatísticas (spans)
    const numPlayersSpan = document.getElementById('numPlayers');
    const recommendedRoundsSpan = document.getElementById('recommendedRounds');

    if (tournamentContainer) {
        tournamentId = tournamentContainer.dataset.tournamentId;
        console.log('DEBUG: Tournament ID obtido:', tournamentId);
    } else {
        console.error('ERRO: Elemento .tournament-container não encontrado no DOM!');
    }

    // Adicione a verificação dos novos spans aqui na condição principal
    if (openAddPlayerModalButton && addPlayerModal && closeButton && addPlayerForm && playerNameInput && playerFormError && tournamentId && numPlayersSpan && recommendedRoundsSpan) {
        console.log('DEBUG: Todos os elementos do modal e tournamentId, e spans de estatísticas foram encontrados. Modal e estatísticas devem funcionar corretamente.');

        openAddPlayerModalButton.addEventListener('click', function() {
            console.log('DEBUG: Botão "Adicionar Novo Jogador" clicado. Abrindo modal.');
            addPlayerModal.style.display = 'flex';
            addPlayerModal.classList.add('show');
            playerNameInput.focus(); // Foca no campo de nome ao abrir o modal
        });

        closeButton.addEventListener('click', function() {
            console.log('DEBUG: Botão "Fechar Modal" clicado. Fechando modal.');
            addPlayerModal.classList.remove('show');
            setTimeout(() => {
                addPlayerModal.style.display = 'none';
                playerFormError.style.display = 'none'; // Limpa a mensagem de erro ao fechar
                playerNameInput.value = ''; // Limpa o campo de entrada ao fechar
            }, 300); // Deve ser igual à duração da transição CSS
        });

        // Fechar modal ao clicar fora
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

        // Fechar modal com a tecla ESC
        document.addEventListener('keydown', function(event) {
            // Verifica se a tecla ESC foi pressionada e se o input de descrição NÃO está ativo
            if ((event.key === 'Escape' || event.key === 'Esc') && editableInput !== document.activeElement) { 
                if (addPlayerModal.classList.contains('show')) {
                    console.log("DEBUG: Tecla ESC pressionada. Fechando modal.");
                    addPlayerModal.classList.remove('show');
                    setTimeout(() => { 
                        addPlayerModal.style.display = 'none';
                        playerFormError.style.display = 'none';
                        playerNameInput.value = '';
                    }, 300);
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

            // Define a action do formulário dinamicamente, garantindo que o tournamentId está correto
            addPlayerForm.action = `/simple_tournament/tournament/${tournamentId}/add_player/`;
            console.log('DEBUG: URL de ação do formulário AJAX:', addPlayerForm.action);

            fetch(addPlayerForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken') // Função auxiliar para obter o CSRF token
                },
                body: new URLSearchParams({ // Converte os dados do formulário para URL-encoded
                    'name': playerName
                })
            })
            .then(response => {
                console.log('DEBUG: Resposta da requisição AJAX de adicionar jogador recebida. Status:', response.status);
                if (!response.ok) {
                    // Se a resposta não for OK (ex: 400, 500), tenta ler como texto para debug
                    return response.text().then(text => { 
                        console.error("ERRO AJAX DETECTADO. Resposta do servidor (não JSON ou erro):", text);
                        throw new Error(`Erro do servidor (${response.status}): ${text.substring(0, 100)}... (ver console para resposta completa)`); 
                    });
                }
                return response.json(); // Se OK, tenta parsear como JSON
            })
            .then(data => {
                if (data.success) {
                    console.log('DEBUG: Jogador adicionado com sucesso:', data.player.name);

                    // --- NOVO: Atualiza a contagem de jogadores e rodadas recomendadas ---
                    // Verifica se os spans existem antes de tentar atualizar
                    if (numPlayersSpan && recommendedRoundsSpan) {
                        numPlayersSpan.innerText = data.num_players;
                        recommendedRoundsSpan.innerText = data.recommended_rounds; // <-- AQUI É ATUALIZADO
                        console.log(`DEBUG: Contagem de jogadores atualizada para ${data.num_players}, rodadas para ${data.recommended_rounds}.`);
                    } else {
                        console.warn("AVISO: Spans de contagem de jogadores/rodadas não encontrados para atualização. Verifique o HTML.");
                    }
                    // --- FIM NOVO ---

                    const playersListContainer = document.querySelector('.players-list-container');
                    const noPlayersMessage = document.querySelector('.no-players-message');

                    // Remove a mensagem "Nenhum jogador adicionado ainda" se ela existir
                    if (noPlayersMessage) {
                        noPlayersMessage.remove();
                        console.log("DEBUG: Mensagem 'Nenhum jogador' removida.");
                    }

                    // Cria e adiciona o novo card do jogador dinamicamente
                    const newPlayerCard = document.createElement('div');
                    newPlayerCard.classList.add('player-card');
                    newPlayerCard.dataset.playerId = data.player.id; // Armazena o ID do jogador
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

                    // Fecha o modal e limpa o formulário
                    addPlayerModal.classList.remove('show');
                    setTimeout(() => {
                        addPlayerModal.style.display = 'none';
                        playerFormError.style.display = 'none';
                        playerNameInput.value = '';
                        console.log("DEBUG: Modal de adicionar jogador fechado e formulário limpo.");
                    }, 300); // Deve ser igual à duração da transição CSS

                    console.log(`SUCESSO: ${data.message}`);

                } else {
                    // Lidar com erros de validação ou outros erros do servidor
                    let errorMessage = data.message || 'Ocorreu um erro ao adicionar o jogador.';
                    if (data.errors) {
                         try {
                            const parsedErrors = JSON.parse(data.errors);
                            // Tenta extrair a mensagem de erro específica do formulário
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
                // Lidar com erros de rede ou falha na requisição
                console.error('ERRO: Falha na requisição AJAX de adicionar jogador:', error);
                playerFormError.innerText = error.message || 'Erro na rede ou servidor.';
                playerFormError.style.display = 'block';
            });
        });
    } else {
        // Log de erro mais detalhado se algum elemento crítico não for encontrado
        console.error('ERRO: Um ou mais elementos do modal de jogador ou dos spans de estatísticas não foram encontrados no DOM ou tournamentId está ausente. As funções de modal/adição de jogador e atualização de estatísticas não funcionarão.');
        console.log({
            openAddPlayerModalButton_exists: !!openAddPlayerModalButton,
            addPlayerModal_exists: !!addPlayerModal,
            closeButton_exists: !!closeButton,
            addPlayerForm_exists: !!addPlayerForm,
            playerNameInput_exists: !!playerNameInput,
            playerFormError_exists: !!playerFormError,
            tournamentId_exists: !!tournamentId,
            tournamentId_value: tournamentId,
            numPlayersSpan_exists: !!numPlayersSpan,         // Verifica se existe
            recommendedRoundsSpan_exists: !!recommendedRoundsSpan // Verifica se existe
        });
    }

    // --- Lógica para Excluir Jogador (delegação de eventos) ---
    // Usamos delegação de eventos porque os cards de jogador são adicionados/removidos dinamicamente.
    const playersSection = document.querySelector('.players-section'); 

    if (playersSection) {
        console.log("DEBUG: Elemento .players-section encontrado para delegação de exclusão.");
        playersSection.addEventListener('click', function(event) {
            const target = event.target;
            // Usa closest para encontrar o botão de exclusão ou um de seus pais
            const deleteButton = target.closest('.delete-player-button');
            
            if (deleteButton) {
                event.preventDefault(); // Impede o envio padrão do formulário imediatamente
                console.log('DEBUG: Botão de exclusão de jogador clicado.');

                // Encontra o player-card pai para obter o ID do jogador
                const playerCard = deleteButton.closest('.player-card');
                if (!playerCard) {
                    console.error('ERRO: player-card não encontrado para o botão de exclusão. A estrutura HTML do card pode estar incorreta.');
                    return;
                }

                const playerId = playerCard.dataset.playerId;
                const currentTournamentId = tournamentId; // Obtém o ID do torneio do escopo superior

                if (!currentTournamentId) {
                    console.error('ERRO: Tournament ID não disponível para exclusão de jogador.');
                    return;
                }

                // Confirmação antes de excluir
                if (confirm(`Tem certeza que deseja excluir o jogador?`)) {
                    const form = deleteButton.closest('form');
                    if (form) {
                        // Define a action do formulário dinamicamente antes de submeter
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
    // Necessária para requisições POST seguras em Django
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Verifica se este cookie começa com o nome que estamos procurando
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // --- Lógica para esconder mensagens flash e fechamento manual ---
    const messagesContainer = document.querySelector('.messages');
    if (messagesContainer) {
        const messageItems = messagesContainer.querySelectorAll('li'); // Seleciona CADA item <li> da mensagem

        messageItems.forEach(messageItem => {
            const closeButton = messageItem.querySelector('.close-message-button'); // Procura o botão DENTRO do <li> atual

            if (closeButton) { // Se o botão for encontrado para este <li>
                closeButton.addEventListener('click', function() {
                    console.log("DEBUG: Botão de fechar mensagem clicado.");
                    messageItem.classList.add('hide'); // Adiciona classe para iniciar a transição de saída
                    setTimeout(() => {
                        messageItem.remove(); // Remove o <li> completamente após a transição
                        // Opcional: verifica se o container de mensagens está vazio e o esconde
                        if (messagesContainer.children.length === 0) {
                            messagesContainer.style.display = 'none';
                        }
                    }, 500); // Deve ser igual ou maior que a duração da transição CSS (.messages li.hide)
                });
            }

            // Lógica para auto-sumir a mensagem após um tempo (5 segundos)
            setTimeout(() => {
                // Verifica se a mensagem ainda não foi escondida (pelo clique, por exemplo)
                if (!messageItem.classList.contains('hide')) {
                    console.log("DEBUG: Mensagem sumindo automaticamente.");
                    messageItem.classList.add('hide'); // Adiciona classe para iniciar a transição
                    setTimeout(() => {
                        messageItem.remove(); // Remove após a transição
                        if (messagesContainer.children.length === 0) {
                            messagesContainer.style.display = 'none';
                        }
                    }, 500); // Deve ser igual ou maior que a duração da transição CSS
                }
            }, 5000); // Inicia a transição após 5 segundos
        });
    }
});