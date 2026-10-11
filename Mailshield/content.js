console.log("Mailshield: Gmail integration loaded.");
(() => {
    "use strict";

    const BUTTON_ID = "mailshield-analyze-button";
    const TOOLBAR_SELECTOR = [
        "div[role='main']",
        "div[role='main'] .aeH"
    ].join(" ");

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
            padding: "9px 14px",
            margin: "10px 8px",
            border: "1px solid #334155",
            borderRadius: "8px",
            background: "#172554",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            fontFamily: "Arial, sans-serif"
        });

        button.addEventListener("click", () => {
            console.log(
                "Mailshield: Analyze button clicked."
            );

            button.textContent = "✓ Button working!";
        });

        return button;
    }

    function addButtonToOpenEmail() {
        const existingButton = document.getElementById(BUTTON_ID);

        if (existingButton) {
            return;
        }

        // Gmail's message toolbar is normally inside a
        // container with role="main". Find an active toolbar.
        const toolbars = document.querySelectorAll(
            'div[role="main"] [role="toolbar"]'
        );

        for (const toolbar of toolbars) {
            if (!toolbar.isConnected) {
                continue;
            }

            const messageArea = toolbar.closest(
                '[role="main"]'
            );

            if (!messageArea) {
                continue;
            }

            // Only add the button when a message is open.
            const messageBody = messageArea.querySelector(
                '[role="list"] [data-message-id], ' +
                '[data-message-id] .a3s'
            );

            if (!messageBody) {
                continue;
            }

            toolbar.appendChild(createAnalyzeButton());

            console.log(
                "Mailshield: Analyze button added."
            );

            return;
        }
    }

    // Gmail changes its interface dynamically, so watch for
    // newly opened messages and rebuilt toolbars.
    const observer = new MutationObserver(() => {
        addButtonToOpenEmail();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    addButtonToOpenEmail();

    console.log(
        "Mailshield: Gmail button integration initialized."
    );
})();
