
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

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const headings = document.querySelectorAll("h1, h2, h3");
            const isHighlighted =
                document.documentElement.dataset.headingsHighlighted === "true";

            headings.forEach((heading) => {
                if (!isHighlighted) {
                    // Save the original inline background color
                    heading.dataset.originalBackground =
                        heading.style.backgroundColor;

                    heading.style.backgroundColor = "#ffeb3b";
                    heading.style.color = "#111111";
                } else {
                    heading.style.backgroundColor =
                        heading.dataset.originalBackground || "";

                    heading.style.color = "";
                    delete heading.dataset.originalBackground;
                }
            });

            document.documentElement.dataset.headingsHighlighted =
                String(!isHighlighted);
        }
    });
});
