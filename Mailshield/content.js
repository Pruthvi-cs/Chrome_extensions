(() => {
    "use strict";

    const BUTTON_CLASS = "mailshield-analyze-button";

    console.log("MAILSHIELD_BUILD_TEST_02 loaded");

    function addButton() {
        const bodies = document.querySelectorAll(".a3s");

        for (const body of bodies) {
            if (!body.isConnected || !body.parentElement) continue;

            const rect = body.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) continue;

            const parent = body.parentElement;

            if (parent.querySelector(`.${BUTTON_CLASS}`)) continue;

            const button = document.createElement("button");
            button.className = BUTTON_CLASS;
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
                cursor: "pointer"
            });

            button.addEventListener("click", () => {
                console.log("MAILSHIELD_BUTTON_CLICKED");
                button.textContent = "✓ Button working!";
            });

            parent.appendChild(button);
            console.log("MAILSHIELD_BUTTON_ADDED");
        }
    }

    const observer = new MutationObserver(addButton);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    addButton();
})();