(() => {
    "use strict";

    const BUTTON_ID = "mailshield-analyze-button";

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
        const bodies = document.querySelectorAll(".a3s");

        for (const body of bodies) {
            const rect = body.getBoundingClientRect();

            if (
                !body.isConnected ||
                rect.width === 0 ||
                rect.height === 0 ||
                !body.parentElement
            ) {
                continue;
            }

            const container = body.closest(".adn");

            if (!container || container.querySelector(`#${BUTTON_ID}`)) {
                continue;
            }

            // Insert into the body's actual parent, not an ancestor.
            const button = createAnalyzeButton();

            try {
                body.parentElement.insertBefore(button, body);

                console.log(
                    "Mailshield: Analyze button added to an open email."
                );
            } catch (error) {
                console.warn(
                    "Mailshield: Could not place the button; Gmail may have updated the message.",
                    error
                );
            }
        }
    }

    let scheduled = false;

    function scheduleButtonCheck() {
        if (scheduled) return;

        scheduled = true;

        requestAnimationFrame(() => {
            scheduled = false;
            addButtonToOpenEmail();
        });
    }

    const observer = new MutationObserver(scheduleButtonCheck);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    addButtonToOpenEmail();

    console.log("Mailshield: Gmail integration initialized.");
})();