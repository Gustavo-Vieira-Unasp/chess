document.addEventListener("DOMContentLoaded", () => {
    // --- Elementos DOM Constantes ---
    const modal = document.getElementById("tournamentModal");
    const createTournamentBtn = document.getElementById("createTournamentBtn");
    const closeModalSpan = document.querySelector(".close");
    const tournamentForm = document.getElementById("tournamentForm");
    const createTournamentError = document.getElementById("create-tournament-error");
    const createTournamentSuccess = document.getElementById("create-tournament-success");
    const dashboard = document.querySelector('.dashboard');
    const messagesContainer = document.querySelector('.messages-container .messages'); // Para mensagens gerais da página

    // --- Constantes de Configuração ---
    const MESSAGE_DISPLAY_TIME_MS = 5000; // Mensagem desaparece após 5 segundos
    const TOURNAMENT_BASE_URL = '/simple_tournament/tournament/'; // Base para URLs de detalhes/deleção
    const CREATE_TOURNAMENT_URL = '/simple_tournament/create_tournament/'; // URL para criação de torneio

    // --- Funções Auxiliares ---

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
                // Verifica se o cookie começa com o nome desejado
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
     * Exibe uma mensagem em um elemento DOM específico.
     * A mensagem desaparece após um tempo definido.
     * @param {HTMLElement} element - O elemento onde a mensagem será exibida.
     * @param {string} message - O texto da mensagem.
     * @param {boolean} isSuccess - true para sucesso (verde), false para erro (vermelho).
     */
    function displayMessage(element, message, isSuccess) {
        element.textContent = message;
        element.style.color = isSuccess ? 'green' : 'red';
        element.style.display = 'block';
        // Define um temporizador para esconder a mensagem
        setTimeout(() => {
            element.style.display = 'none';
            element.textContent = ''; // Limpa o texto da mensagem
        }, MESSAGE_DISPLAY_TIME_MS);
    }

    /**
     * Adiciona uma mensagem temporária a um contêiner de mensagens geral da página.
     * @param {string} message - O texto da mensagem.
     * @param {string} type - O tipo de mensagem (ex: 'success', 'error', 'warning').
     */
    function addPageMessage(message, type) {
        if (!messagesContainer) {
            console.warn("Contêiner de mensagens gerais não encontrado.");
            return;
        }
        const li = document.createElement('li');
        li.textContent = message;
        li.classList.add(type); // Adiciona classe para estilização CSS
        messagesContainer.appendChild(li);

        // Remove a mensagem após um tempo
        setTimeout(() => {
            li.remove();
        }, MESSAGE_DISPLAY_TIME_MS);
    }

    /**
     * Renderiza um novo card de torneio no dashboard.
     * @param {object} tournament - Objeto do torneio com 'id', 'name', 'date'.
     */
    function renderTournamentCard(tournament) {
        const newCard = document.createElement('a');
        // Usando o ID do torneio na URL, com o prefixo correto
        newCard.href = `${TOURNAMENT_BASE_URL}${tournament.id}/`; 
        newCard.classList.add('tournament-link-container');
        newCard.innerHTML = `
            <div class="container" data-tournament-id="${tournament.id}">
                <div class="delete-option hidden">
                    <button type="button" class="delete-button" data-tournament-id="${tournament.id}" aria-label="Excluir torneio">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
                <div class="text-section">
                    <div class="tournament-name">${tournament.name}</div>
                    <div class="tournament-date">${tournament.date || 'Data não definida'}</div>
                </div>
            </div>
        `;
        // Inserir o novo card após o botão "Criar Torneio" existente
        // Isso assume que createTournamentBtn é o primeiro item no dashboard.
        dashboard.insertBefore(newCard, createTournamentBtn.nextElementSibling);

        // Re-adicionar listeners para o novo card (para o hover e delete)
        const newContainer = newCard.querySelector('.container');
        if (newContainer) {
            newContainer.addEventListener('mouseenter', () => toggleDeleteOption(newContainer, true));
            newContainer.addEventListener('mouseleave', () => toggleDeleteOption(newContainer, false));
        }
        // O listener de clique para o botão de deletar já é delegado globalmente, não precisa re-adicionar aqui.
    }

    // --- Lógica do Modal ---
    const showModal = () => {
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
        const tournamentNameInput = document.getElementById("tournament_name");
        if (tournamentNameInput) tournamentNameInput.focus();
        createTournamentError.style.display = 'none'; // Limpa mensagens de erro/sucesso anteriores
        createTournamentSuccess.style.display = 'none';
        tournamentForm.reset(); // Reseta o formulário para um novo uso
    };

    const hideModal = () => {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        // Retorna o foco para o botão de criar torneio quando o modal é fechado
        if (createTournamentBtn) createTournamentBtn.focus();
    };

    // --- Listeners de Eventos do Modal ---
    createTournamentBtn.addEventListener("click", showModal);
    closeModalSpan.addEventListener("click", hideModal);

    // Fechar modal ao clicar fora dele
    window.addEventListener("click", (event) => {
        if (event.target === modal) hideModal();
    });

    // Fechar modal ao pressionar ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("show")) hideModal();
    });

    // --- Submissão do Formulário de Criação (AJAX) ---
    tournamentForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário

        const nameInput = document.getElementById("tournament_name");
        const dateInput = document.getElementById("tournament_date");
        const descriptionInput = document.getElementById("tournament_description");

        let isValid = true;
        // Limpa mensagens de erro anteriores para o formulário
        createTournamentError.textContent = ''; 
        createTournamentError.style.display = 'none';

        // Validação básica do nome
        if (!nameInput.value.trim()) {
            isValid = false;
            nameInput.nextElementSibling.style.display = "inline"; // Mostra mensagem de erro do campo
        } else {
            nameInput.nextElementSibling.style.display = "none"; // Esconde mensagem de erro
        }

        if (!isValid) {
            displayMessage(createTournamentError, "Por favor, preencha todos os campos obrigatórios.", false);
            return; // Interrompe a função se a validação falhar
        }

        const formData = new FormData();
        formData.append('tournament_name', nameInput.value.trim());
        formData.append('tournament_date', dateInput.value.trim()); // Pode ser vazio
        formData.append('tournament_description', descriptionInput.value.trim()); // Pode ser vazio

        try {
            // Usa a action do formulário (agora definida no HTML) ou o fallback correto
            const response = await fetch(tournamentForm.action || CREATE_TOURNAMENT_URL, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken, // Essencial para requisições POST no Django
                    'X-Requested-With': 'XMLHttpRequest', // Indica que é uma requisição AJAX
                },
                body: formData, // FormData lida com 'Content-Type' automaticamente
            });

            // Verifica se a resposta HTTP é OK (status 2xx)
            if (!response.ok) {
                // Tenta ler o JSON para erros específicos do servidor
                const errorData = await response.json().catch(() => ({})); // Captura erro se não for JSON
                throw new Error(errorData.message || errorData.error || `Erro HTTP: ${response.status}`);
            }

            const data = await response.json(); // Tenta parsear a resposta como JSON

            if (data.message) {
                displayMessage(createTournamentSuccess, data.message, true);
                renderTournamentCard(data.tournament); // Renderiza o novo card na página
                hideModal(); // Fecha a modal
                addPageMessage(data.message, 'success'); // Adiciona mensagem geral na página
            } else {
                // Caso o backend não retorne 'message' mas o status seja OK (improvável mas possível)
                displayMessage(createTournamentError, 'Resposta inesperada do servidor.', false);
            }
        } catch (error) {
            console.error('Erro ao criar torneio:', error);
            // Mensagem de erro mais detalhada para o usuário, se disponível
            displayMessage(createTournamentError, `Erro: ${error.message || 'Erro de conexão ou servidor. Tente novamente.'}`, false);
        }
    });

    // --- Lógica de Deleção de Torneio (AJAX) ---

    /**
     * Alterna a visibilidade da opção de deletar em um container.
     * @param {HTMLElement} container - O elemento container do torneio.
     * @param {boolean} show - True para mostrar, false para esconder.
     */
    function toggleDeleteOption(container, show = true) {
        const deleteOption = container.querySelector('.delete-option');
        if (deleteOption) {
            deleteOption.classList.toggle('hidden', !show);
        }
    }

    // Adiciona listeners de mouse para todos os containers existentes para mostrar/esconder o botão de deletar
    document.querySelectorAll('.container').forEach(container => {
        container.addEventListener('mouseenter', () => toggleDeleteOption(container, true));
        container.addEventListener('mouseleave', () => toggleDeleteOption(container, false));
    });

    /**
     * Lida com a exclusão de um torneio via requisição AJAX.
     * @param {Event} event - O evento de clique.
     */
    async function handleDelete(event) {
        event.preventDefault(); // Impede o comportamento padrão do elemento
        event.stopPropagation(); // Impede que o clique no botão de delete propague para o link do container

        const button = event.target.closest('.delete-button');
        if (!button) return; // Garante que o evento veio de um botão de delete

        const tournamentId = button.dataset.tournamentId;
        const tournamentNameElement = button.closest('.container').querySelector('.tournament-name');
        const tournamentName = tournamentNameElement ? tournamentNameElement.textContent : `ID ${tournamentId}`; // Fallback para nome

        if (confirm(`Tem certeza que deseja excluir o torneio '${tournamentName}'? Esta ação é irreversível e excluirá todos os jogadores e partidas associadas.`)) {
            try {
                // Constrói a URL de deleção com o prefixo correto
                const deleteUrl = `${TOURNAMENT_BASE_URL}${tournamentId}/delete/`;
                const response = await fetch(deleteUrl, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                // Verifica se a resposta HTTP é OK (status 2xx)
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || errorData.error || `Erro HTTP: ${response.status}`);
                }

                const data = await response.json();

                if (data.message) {
                    addPageMessage(data.message, 'success');
                    button.closest('.tournament-link-container').remove(); // Remove o card do DOM
                } else {
                    addPageMessage('Resposta inesperada do servidor ao excluir torneio.', 'error');
                }
            } catch (error) {
                console.error('Erro ao excluir torneio:', error);
                addPageMessage(`Erro: ${error.message || 'Erro de conexão ou servidor ao excluir torneio.'}`, 'error');
            }
        }
    }
    
    // Delegação de evento para cliques nos botões de exclusão.
    // Isso garante que botões adicionados dinamicamente também terão o listener.
    document.addEventListener('click', (event) => {
        if (event.target.closest('.delete-button')) {
            handleDelete(event);
        }
    });

});