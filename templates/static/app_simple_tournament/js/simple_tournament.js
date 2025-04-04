// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("tournamentModal");
    const btn = document.getElementById("createTournamentBtn");
    const span = document.getElementsByClassName("close")[0];

    // Modal Functions
    const showModal = () => {
        if (modal) {
            modal.style.display = "block";
            document.getElementById("tournament_name").focus(); // Focus on the input field
        }
    };
    const hideModal = () => modal && (modal.style.display = "none");

    // Event Listeners
    if (btn) btn.onclick = showModal;
    if (span) span.onclick = hideModal;

    window.onclick = function (event) {
        if (modal && event.target === modal) hideModal();
    };

    // Close modal with Escape key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal && modal.style.display === "block") {
            hideModal();
        }
    });
});

function showDeleteOption(container) {
    const deleteOption = container.querySelector('.delete-option');
    deleteOption.style.display = 'block';
}

function hideDeleteOption(container) {
    const deleteOption = container.querySelector('.delete-option');
    deleteOption.style.display = 'none';
}

function shareTournament() {
    if (navigator.share) {
        navigator.share({
            title: '{{ tournament.name }}',
            url: window.location.href,
        }).catch((error) => console.log('Error sharing:', error));
    } else {
        alert('Sharing is not supported in this browser.');
    }
}

document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click from triggering the parent link
    });
});