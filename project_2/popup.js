const darkButton = document.getElementById("darkMode");
const lightButton = document.getElementById("lightMode");

darkButton.addEventListener("click", async () => {

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    await chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },

        func: () => {
            document.body.style.backgroundColor = "black";
            document.body.style.color = "white";
        }
    });

});


lightButton.addEventListener("click", async () => {

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    await chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },

        func: () => {
            document.body.style.backgroundColor = "white";
            document.body.style.color = "black";
        }
    });

});