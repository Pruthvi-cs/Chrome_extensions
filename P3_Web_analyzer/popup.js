
const analyzeButton = document.getElementById("analyzeButton");
const results = document.getElementById("results");


// When the Analyze button is clicked
analyzeButton.addEventListener("click", async () => {

    // Get the currently active tab
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });


    // Check whether the page can be accessed
    if (!tab.url || tab.url.startsWith("chrome://")) {

        results.textContent =
            " Cannot analyze this Chrome page.";

        return;
    }


    // Execute JavaScript inside the current webpage
    const pageData = await chrome.scripting.executeScript({

        target: {
            tabId: tab.id
        },


        // This function runs INSIDE the webpage
        func: () => {

            // -----------------------------
            // BASIC PAGE INFORMATION
            // -----------------------------

            const title = document.title;

            const currentUrl = location.href;


            // -----------------------------
            // COUNT PAGE ELEMENTS
            // -----------------------------

            const h1Count =
                document.querySelectorAll("h1").length;

            const h2Count =
                document.querySelectorAll("h2").length;

            const paragraphCount =
                document.querySelectorAll("p").length;

            const imageCount =
                document.querySelectorAll("img").length;

            const linkCount =
                document.querySelectorAll("a").length;

            const buttonCount =
                document.querySelectorAll("button").length;


            // -----------------------------
            // EXTRACT HEADINGS
            // -----------------------------

            const headings =
                document.querySelectorAll("h1, h2, h3");

            const headingData = [];


            headings.forEach(heading => {

                const text =
                    heading.textContent.trim();

                if (text) {

                    headingData.push({
                        type: heading.tagName,
                        text: text
                    });

                }

            });

let internalLinks = 0;
let externalLinks = 0;
            // -----------------------------
            // EXTRACT LINKS
            // -----------------------------

            const links =
                document.querySelectorAll("a");

            const linkData = [];


            links.forEach(link => {

                // Get visible link text
                const text =
                    link.textContent.trim();


                // Get original href from HTML
                const href =
                    link.getAttribute("href");


                // Only process links that have href
                if (href) {

                    // Convert relative URL
                    // into complete URL
                    const fullUrl =
                        new URL(
                            href,
                            location.href
                        ).href;


                    linkData.push({

                        text: text,

                        url: fullUrl

                    });

                }

            });


            // -----------------------------
            // RETURN DATA TO POPUP display
            // -----------------------------

            return {

                title: title,

                url: currentUrl,

                h1: h1Count,

                h2: h2Count,

                paragraphs: paragraphCount,

                images: imageCount,

                links: linkCount,

                buttons: buttonCount,

                headings: headingData,

                linkData: linkData

            };

        }

    });


    // Get the actual result returned
    // from the webpage here 
    const data = pageData[0].result;


    let headingHTML = "";


    data.headings.forEach(heading => {

        headingHTML += `
            <div>
                <strong>${heading.type}</strong>
                ${heading.text}
            </div>
        `;

    });


    // If there are no headings
    if (headingHTML === "") {

        headingHTML =
            "<em>No headings found.</em>";

    }


    // -----------------------------
    // CREATE LINK HTML
    // -----------------------------

    let linkHTML = "";


    data.linkData.forEach(link => {

        linkHTML += `
            <div style="margin-bottom: 10px;">

                <strong>
                    ${link.text || "Unnamed link"}
                </strong>

                <br>

                <small>
                    ${link.url}
                </small>

            </div>
        `;

    });


    // If there are no links
    if (linkHTML === "") {

        linkHTML =
            "<em>No links found.</em>";

    }


    // -----------------------------
    // DISPLAY RESULTS
    // -----------------------------

    results.innerHTML = `

        <hr>

        <h3> Page Information</h3>

        <strong>Title:</strong>
        ${data.title}

        <br><br>

        <strong>URL:</strong>
        <small>${data.url}</small>


        <h3> Statistics</h3>

        <strong>H1:</strong>
        ${data.h1}

        <br>

        <strong>H2:</strong>
        ${data.h2}

        <br>

        <strong>Paragraphs:</strong>
        ${data.paragraphs}

        <br>

        <strong>Images:</strong>
        ${data.images}

        <br>

        <strong>Links:</strong>
        ${data.links}

        <br>

        <strong>Buttons:</strong>
        ${data.buttons}


        <h3> Headings</h3>

        ${headingHTML}


        <h3> Links</h3>

        ${linkHTML}

    `;

});
