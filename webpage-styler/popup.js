
const darkModeBtn = document.getElementById("darkModeBtn");

darkModeBtn.addEventListener("click", async () => {
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
                const styleId = "webpage-styler-dark-mode-style";
                const existingStyle = document.getElementById(styleId);

                // If our stylesheet exists, remove only our own changes.
                if (existingStyle) {
                    existingStyle.remove();
                    console.log("Dark mode disabled!");
                    return;
                }

                // Create our own stylesheet.
                const style = document.createElement("style");
                style.id = styleId;

                style.textContent = `
                    html {
                        filter: invert(1) hue-rotate(180deg) !important;
                    }

                    img, video, picture, canvas, svg {
                        filter: invert(1) hue-rotate(180deg) !important;
                    }
                `;

                (document.head || document.documentElement)
                    .appendChild(style);

                console.log("Dark mode enabled!");
            }
        });
    } catch (error) {
        console.error("Unable to toggle dark mode:", error);
    }
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
