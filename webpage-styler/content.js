
console.log("Webpage Styler content script loaded!");

// Apply dark mode to the current webpage and its media elements
function enableDarkMode() {
    document.documentElement.style.filter = "invert(1) hue-rotate(180deg)";

    // Keep images and videos looking normal
    const media = document.querySelectorAll("img, video, picture, canvas");

    media.forEach((element) => {
        element.style.filter = "invert(1) hue-rotate(180deg)";
    });

    console.log("Dark mode enabled!");
}

// Remove dark mode from the current webpage
function disableDarkMode() {
    document.documentElement.style.filter = "";

    const media = document.querySelectorAll("img, video, picture, canvas");

    media.forEach((element) => {
        element.style.filter = "";
    });

    console.log("Dark mode disabled!");
}   