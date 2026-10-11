(() => {
    "use strict";

    const BUTTON_ID = "mailshield-analyze-button";
    const MESSAGE_BODY_SELECTOR = ".a3s";

    function createAnalyzeButton() {
        const button = document.createElement("button");

        button.id = BUTTON_ID;
        button.type = "button";
        button.textContent = "🛡 Analyze with Mailshield";
        button.setAttribute(
            "aria-label",
            "Analyze this email with Mailshield"
        );

        Object.assign(button.style, {
            display: "inline-block",
            padding: "10px 16px",
            margin: "12px 0",
            border: "1px solid #475569",
            borderRadius: "8px",
            background: "#172554",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            fontFamily: "Arial, sans-serif"
        });

        button.addEventListener("click", () => {
            console.log("Mailshield: Analyze button clicked.");

            button.textContent = "✓ Button working!";
        });

        return button;
    }

    function addButtonToOpenEmail() {
        const messageBodies = document.querySelectorAll(
            MESSAGE_BODY_SELECTOR
        );

        for (const body of messageBodies) {
            const rect = body.getBoundingClientRect();

            // Ignore hidden or collapsed message bodies.
            if (rect.width === 0 || rect.height === 0) {
                continue;
            }

            const messageContainer = body.closest(".gs");

            if (!messageContainer) {
                continue;
            }

            // Prevent duplicate buttons.
            if (messageContainer.querySelector(`#${BUTTON_ID}`)) {
                continue;
            }

            const button = createAnalyzeButton();

            // Insert before the email body so it is easy to find.
            messageContainer.insertBefore(button, body);

            console.log(
                "Mailshield: Analyze button added to an open email."
            );
        }
    }

    const observer = new MutationObserver(() => {
        addButtonToOpenEmail();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    addButtonToOpenEmail();

    console.log("Mailshield: Gmail integration initialized.");
})();