// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function () {
    // Get the modal
    var modal = document.getElementById("tournamentModal");

    // Get the button that opens the modal
    var btn = document.getElementById("createTournamentBtn");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // Open the modal when the button is clicked
    if (btn) {
        btn.onclick = function () {
            if (modal) {
                modal.style.display = "block";
            }
        };
    }

    // Close the modal when the user clicks on <span> (x)
    if (span) {
        span.onclick = function () {
            if (modal) {
                modal.style.display = "none";
            }
        };
    }

    // Close the modal if the user clicks outside of it
    window.onclick = function (event) {
        if (modal && event.target == modal) {
            modal.style.display = "none";
        }
    };
});