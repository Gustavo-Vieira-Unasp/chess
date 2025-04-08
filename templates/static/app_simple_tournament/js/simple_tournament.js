document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("tournamentModal");
    const btn = document.getElementById("createTournamentBtn");
    const span = document.querySelector(".close");

    if (!modal || !btn || !span) return console.error("Required elements not found!");

    const showModal = () => {
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
        document.getElementById("tournament_name")?.focus();
    };

    const hideModal = () => {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        btn.focus();
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
            console.log('Delete button clicked');
        }
    });
});

function toggleDeleteOption(container, show = true) {
    const deleteOption = container.querySelector('.delete-option');
    if (deleteOption) deleteOption.classList.toggle('hidden', !show);
}