
const darkModeBtn = document.getElementById("darkModeBtn");
console.log("Popup JavaScript loaded");

console.log("Dark button:", document.getElementById("darkModeBtn"));
console.log(
    "Highlight button:",
    document.getElementById("highlightHeadingsBtn")
);
darkModeBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab?.id || !tab.url?.startsWith("http")) {
        alert("Please open a normal website first!");
        return;
    }

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const root = document.documentElement;

            if (root.dataset.stylerDark === "true") {
                root.style.filter = "";
                document.querySelectorAll(
                    "img, video, picture, canvas"
                ).forEach(element => {
                    element.style.filter = "";
                });

                root.dataset.stylerDark = "false";
            } else {
                root.style.filter = "invert(1) hue-rotate(180deg)";

                document.querySelectorAll(
                    "img, video, picture, canvas"
                ).forEach(element => {
                    element.style.filter = "invert(1) hue-rotate(180deg)";
                });

                root.dataset.stylerDark = "true";
            }
        }
    });
});


const highlightHeadingsBtn = document.getElementById("highlightHeadingsBtn");

highlightHeadingsBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab?.id || !tab.url?.startsWith("http")) {
        alert("Please open a normal website first!");
        return;
    }

    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const styleId = "webpage-styler-heading-highlight-style";
                const existingStyle = document.getElementById(styleId);

                // If the stylesheet exists, remove it.
                if (existingStyle) {
                    existingStyle.remove();
                    console.log("Heading highlights removed!");
                    return;
                }

                // Create a temporary stylesheet.
                const style = document.createElement("style");
                style.id = styleId;

                style.textContent = `
                    h1, h2, h3 {
                        background-color: #ffeb3b !important;
                        color: #111111 !important;
                        outline: 2px solid #f0c000 !important;
                    }
                `;

                // Add the stylesheet to the current webpage.
                (document.head || document.documentElement)
                    .appendChild(style);

                console.log("Heading highlights enabled!");
            }
        });
    } catch (error) {
        console.error("Unable to highlight headings:", error);
    }
});
