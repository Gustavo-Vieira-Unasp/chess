document.addEventListener("DOMContentLoaded", () => {
    const descriptionText = document.getElementById("descriptionText");
    const editButton = document.getElementById("editButton");
    const editableInput = document.getElementById("editableInput");
    const saveButton = document.getElementById("saveButton");
    const hiddenDescription = document.getElementById("hiddenDescription");

    // Show the textarea and hide the plain text when editing starts
    const startEditing = () => {
        editableInput.style.display = "block";
        descriptionText.style.display = "none";
        saveButton.style.display = "block"; // Show the Save button
        editableInput.focus(); // Focus on the input field
    };

    // Update the hidden input field with the new description
    const updateHiddenField = () => {
        const newDescription = editableInput.value.trim();
        if (newDescription) {
            hiddenDescription.value = newDescription; // Update the hidden field
        }
    };

    // Toggle editing mode when the edit button is clicked
    editButton.addEventListener("click", startEditing);

    // Update the hidden input field when clicking the Save button
    saveButton.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent form submission until the field is updated
        updateHiddenField();
        document.getElementById("saveForm").submit(); // Submit the form
    });

    // Update the hidden input field when pressing Enter in the textarea
    editableInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent adding a newline
            updateHiddenField();
            document.getElementById("saveForm").submit(); // Submit the form
        }
    });

    // Update the hidden input field when clicking outside the textarea
    editableInput.addEventListener("blur", () => {
        updateHiddenField();
        document.getElementById("saveForm").submit(); // Submit the form
    });
});