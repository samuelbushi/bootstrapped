/**
 * Bootstrapped JS
 * v0.0.1
 * 
 * 
 * - Toast Notifications
 * - Input Modal Request Modal
 * - Alerts
 * 
 *
 */









  /**
 * Bootstrap Modal and Toast Utility Functions
 * ===========================================
 * 
 * A collection of utility functions to manage Bootstrap modals and toasts:
 * - Confirmation Modal
 * - Input Request Modal
 * - Alerts
 * 
 * Functions:
 * ----------
 * showConfirmationModal(options)
 *   - Displays a confirmation modal with customizable title, body text, button text, and action callback.
 *   - Parameters:
 *     - title: Modal title (default: "Modal Title")
 *     - bodyText: Modal body text (default: "Modal paragraph text")
 *     - cancelText: Cancel button text (default: "Cancel Button")
 *     - actionText: Action button text (default: "Action Button")
 *     - actionButtonType: Bootstrap button type for action button (default: "primary")
 *     - actionCallback: Callback function for action button (default: null)
 * 
 * showInputRequestModal(options)
 *   - Displays an input request modal with customizable title, description, input placeholder, button text, and button callback.
 *   - Parameters:
 *     - title: Modal title (default: "Input Request Title")
 *     - description: Modal description (default: "Input Request Description")
 *     - placeholder: Input placeholder text (default: "Input Placeholder")
 *     - buttonText: Button text (default: "Confirm Input")
 *     - buttonCallback: Callback function for button (default: null)
 * 

 * 
 * showAlert(options)
 *   - Displays an alert with customizable message, type, link, and dismissibility.
 *   - Parameters:
 *     - parentElementId: ID of the parent element where the alert will be inserted
 *     - message: Alert message text (default: "This is an alert!")
 *     - alertType: Bootstrap alert type (default: "success")
 *     - linkText: Optional link text (default: "")
 *     - linkHref: Optional link href (default: "#")
 *     - dismissible: Whether the alert is dismissible (default: true)
 * 
 */






function showInputRequestModal({
    title = "Input Request Title",
    description = "Input Request Description",
    placeholder = "Input Placeholder",
    buttonText = "Confirm Input",
    buttonCallback = null // Optional callback function for the button
} = {}) {
    // Update modal content
    document.getElementById("inputRequestTitle").innerText = title;
    document.getElementById("inputRequestDescription").innerText = description;
    document.getElementById("inputRequestInput").placeholder = placeholder;
    const actionButton = document.getElementById("inputRequestButton");
    
    // Set button text
    actionButton.innerText = buttonText;

    // Remove any existing event listeners to avoid duplication
    const newActionButton = actionButton.cloneNode(true);
    actionButton.parentNode.replaceChild(newActionButton, actionButton);

    // Function to handle button click
    const handleButtonClick = () => {
        const inputValue = document.getElementById("inputRequestInput").value;
        if (typeof buttonCallback === 'function') {
            buttonCallback(inputValue);
        }
        modal.hide(); // Hide the modal after action
    };

    // Attach the callback function for the button
    newActionButton.addEventListener('click', handleButtonClick);

    // Function to handle Enter key press
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleButtonClick();
        }
    };

    // Attach keypress event listener to the input
    const inputElement = document.getElementById("inputRequestInput");
    inputElement.addEventListener('keypress', handleKeyPress);

    // Initialize and show the modal using Bootstrap 5
    const modalElement = document.getElementById('inputRequestModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Remove event listeners when modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
        newActionButton.removeEventListener('click', handleButtonClick);
        inputElement.removeEventListener('keypress', handleKeyPress);
    });
}






///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Alerts */
function showAlert({
    parentElementId,  // The ID of the element where the alert will be inserted
    message = "This is an alert!",  // Alert message text
    alertType = "success",  // Bootstrap alert type (success, danger, warning, etc.)
    linkText = "",  // Optional link text
    linkHref = "#",  // Optional link href
    dismissible = true  // Whether the alert is dismissible or not
} = {}) {
    // Create the alert container div
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('alert', `alert-${alertType}`, 'fade', 'show');
    
    // Add the dismiss button if the alert is dismissible
    if (dismissible) {
        alertDiv.classList.add('alert-dismissible');
        const closeButton = document.createElement('button');
        closeButton.setAttribute('type', 'button');
        closeButton.setAttribute('class', 'btn-close');
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        alertDiv.appendChild(closeButton);
    }

    // Add the alert message text
    const alertMessage = document.createElement('span');
    alertMessage.innerText = message;
    alertDiv.appendChild(alertMessage);

    // Add the link if specified
    if (linkText) {
        const alertLink = document.createElement('a');
        alertLink.classList.add('alert-link');
        alertLink.href = linkHref;
        alertLink.innerText = linkText;
        alertDiv.appendChild(alertLink);
    }

    // Insert the alert at the beginning of the parent element
    const parentElement = document.getElementById(parentElementId);
    if (parentElement) {
        parentElement.insertBefore(alertDiv, parentElement.firstChild);
    } else {
        console.error(`Parent element with ID "${parentElementId}" not found.`);
    }
}

