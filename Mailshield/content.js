(() => {
    "use strict";

    const BUTTON_ID = "mailshield-analyze-button";
    const MESSAGE_BODY_SELECTOR = ".a3s";

    function createAnalyzeButton() {
        const button = document.createElement("button");

        button.id = BUTTON_ID;
        button.type = "button";
        button.textContent = "🛡 Analyze with Mailshield";

        Object.assign(button.style, {
            display: "block",
            padding: "10px 16px",
            margin: "14px 0",
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
        const bodies = document.querySelectorAll(
            MESSAGE_BODY_SELECTOR
        );

        for (const body of bodies) {
            if (!body.isConnected) continue;

            const rect = body.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) {
                continue;
            }

            const container = body.closest(".adn");

            if (!container || !container.isConnected) {
                continue;
            }

            if (container.querySelector(`#${BUTTON_ID}`)) {
                continue;
            }

            // Append directly to the message container.
            // This avoids insertBefore() and its parent-node error.
            const button = createAnalyzeButton();

            try {
                container.appendChild(button);

                console.log(
                    "Mailshield: Button added to message container."
                );
            } catch (error) {
                console.warn(
                    "Mailshield: Could not add button.",
                    error
                );
            }
        }
    }

    let scheduled = false;

    function scheduleCheck() {
        if (scheduled) return;

        scheduled = true;

        requestAnimationFrame(() => {
            scheduled = false;
            addButtonToOpenEmail();
        });
    }

    const observer = new MutationObserver(scheduleCheck);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    addButtonToOpenEmail();

    console.log("Mailshield: Integration initialized.");
})();