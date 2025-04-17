document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("tournamentModal");
    const btn = document.getElementById("createTournamentBtn");
    const span = document.querySelector(".close");

    if (!modal || !btn || !span) {
        console.error("Required elements not found!");
        return;
    }

    const showModal = () => {
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
        const tournamentNameInput = document.getElementById("tournament_name");
        if (tournamentNameInput) tournamentNameInput.focus();
    };

    const hideModal = () => {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        if (btn) btn.focus();
    };

    btn.addEventListener("click", showModal);
    span.addEventListener("click", hideModal);

    window.addEventListener("click", (event) => {
        if (event.target === modal) hideModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("show")) hideModal();
    });

    // Hover effects for delete options
    document.querySelectorAll('.container').forEach(container => {
        container.addEventListener('mouseenter', () => toggleDeleteOption(container, true));
        container.addEventListener('mouseleave', () => toggleDeleteOption(container, false));
    });

    // Event delegation for delete buttons
    document.addEventListener('click', (event) => {
        if (event.target.matches('.delete-button')) {
            event.stopPropagation();
            handleDelete(event.target);
        }
    });

    // Form validation
    document.getElementById("tournamentForm")?.addEventListener("submit", (event) => {
        let isValid = true;

        const nameInput = document.getElementById("tournament_name");
        const dateInput = document.getElementById("tournament_date");

        if (!nameInput.value.trim()) {
            isValid = false;
            nameInput.nextElementSibling.style.display = "inline";
        } else {
            nameInput.nextElementSibling.style.display = "none";
        }

        if (!dateInput.value.trim()) {
            isValid = false;
            dateInput.nextElementSibling.style.display = "inline";
        } else {
            dateInput.nextElementSibling.style.display = "none";
        }

        if (!isValid) {
            event.preventDefault(); // Prevent form submission if invalid
        }
    });
});

function toggleDeleteOption(container, show = true) {
    const deleteOption = container.querySelector('.delete-option');
    if (deleteOption) {
        deleteOption.classList.toggle('hidden', !show);
    }
}

function handleDelete(button) {
    const container = button.closest('.container');
    if (container) {
        container.remove(); // Perform the delete action
    }
}