// ============================================================
// WEBSITE ANALYZER - POPUP.JS
// ============================================================


// ============================================================
// GET HTML ELEMENTS
// ============================================================

const analyzeButton =
    document.getElementById("analyzeButton");

const results =
    document.getElementById("results");

const downloadButton =
    document.getElementById("downloadButton");

const downloadCSVButton =
    document.getElementById("downloadCSVButton");


// ============================================================
// GLOBAL ANALYSIS DATA
// ============================================================

// This stores the latest analysis result.
// JSON and CSV download functions use this data.

let analysisData = null;


// ============================================================
// CREATE HEADING HTML
// ============================================================

function createHeadingHTML(headings) {

    let html = "";


    headings.forEach(heading => {

        html += `
            <div style="margin-bottom: 8px;">

                <strong>
                    ${heading.type}
                </strong>

                ${heading.text}

            </div>
        `;

    });


    // If no headings were found

    if (html === "") {

        html =
            "<em>No headings found.</em>";

    }


    return html;
}


// ============================================================
// CREATE LINK HTML
// ============================================================

function createLinkHTML(links) {

    let html = "";


    links.forEach(link => {

        html += `
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


    // If no links were found

    if (html === "") {

        html =
            "<em>No links found.</em>";

    }


    return html;
}


// ============================================================
// RENDER RESULTS
// ============================================================

function renderResults(
    data,
    headingHTML,
    linkHTML
) {

    results.innerHTML = `

        <hr>

        <h3>
             Page Information
        </h3>


        <strong>
            Title:
        </strong>

        ${data.title}

        <br><br>


        <strong>
            URL:
        </strong>

        <br>

        <small>
            ${data.url}
        </small>


        <h3>
             Statistics
        </h3>

        <strong>
            Title:
        </strong>

            ${data.hasTitle ? " Present" : " Missing"}

        <br>


        <strong>
            H1:
        </strong>

        ${data.h1}

        <br>


        <strong>
            H2:
        </strong>

        ${data.h2}

        <br>


        <strong>
            Paragraphs:
        </strong>

        ${data.paragraphs}

        <br>


        <strong>
            Images:
        </strong>

        ${data.images}

        <br>


        <strong>
            Links:
        </strong>

        ${data.links}

        <br>


        <strong>
            Internal Links:
        </strong>

        ${data.internalLinks}

        <br>


        <strong>
            External Links:
        </strong>

        ${data.externalLinks}

        <br>


        <strong>
            Buttons:
        </strong>

        ${data.buttons}


        <h3>
             Headings
        </h3>

        ${headingHTML}


        <h3>
             Links
        </h3>

        ${linkHTML}

    `;
}


// ============================================================
// ANALYZE BUTTON
// ============================================================

analyzeButton.addEventListener(
    "click",
    async () => {

        try {

            // ====================================================
            // GET CURRENT TAB
            // ====================================================

            const [tab] =
                await chrome.tabs.query({

                    active: true,
                    currentWindow: true

                });


            // ====================================================
            // CHECK IF PAGE CAN BE ANALYZED
            // ====================================================

            if (
                !tab.url ||
                tab.url.startsWith("chrome://") ||
                tab.url.startsWith("chrome-extension://") ||
                tab.url.startsWith("edge://") ||
                tab.url.startsWith("about:")
            ) {

                results.textContent =
                    "⚠️ Cannot analyze this browser page.";

                return;
            }


            // ====================================================
            // EXECUTE SCRIPT INSIDE WEBPAGE
            // ====================================================

            const pageData =
                await chrome.scripting.executeScript({

                    target: {

                        tabId: tab.id

                    },


                    func: () => {


                        // =================================================
                        // BASIC PAGE INFORMATION
                        // =================================================

                        const title =
                            document.title;


                        const currentUrl =
                            location.href;
                        
                            const hasTitle =
                            title.trim().length > 0;


                        // =================================================
                        // COUNT PAGE ELEMENTS
                        // =================================================

                        const h1Count =
                            document.querySelectorAll(
                                "h1"
                            ).length;


                        const h2Count =
                            document.querySelectorAll(
                                "h2"
                            ).length;


                        const paragraphCount =
                            document.querySelectorAll(
                                "p"
                            ).length;


                        const imageCount =
                            document.querySelectorAll(
                                "img"
                            ).length;


                        const linkCount =
                            document.querySelectorAll(
                                "a"
                            ).length;


                        const buttonCount =
                            document.querySelectorAll(
                                "button"
                            ).length;


                        // =================================================
                        // EXTRACT HEADINGS
                        // =================================================

                        const headings =
                            document.querySelectorAll(
                                "h1, h2, h3"
                            );


                        const headingData = [];


                        headings.forEach(
                            heading => {

                                const text =
                                    heading.textContent
                                        .replace(/\s+/g, " ")
                                        .trim();


                                if (text) {

                                    headingData.push({

                                        type:
                                            heading.tagName,

                                        text:
                                            text

                                    });

                                }

                            }
                        );


                        // =================================================
                        // LINK COUNTERS
                        // =================================================

                        let internalLinks = 0;

                        let externalLinks = 0;


                        // =================================================
                        // EXTRACT LINKS
                        // =================================================

                        const links =
                            document.querySelectorAll(
                                "a"
                            );


                        const linkData = [];


                        links.forEach(
                            link => {


                                // -----------------------------------------
                                // GET LINK TEXT
                                // -----------------------------------------

                                const text =
                                    link.textContent
                                        .replace(/\s+/g, " ")
                                        .trim();


                                // -----------------------------------------
                                // GET ORIGINAL HREF
                                // -----------------------------------------

                                const href =
                                    link.getAttribute(
                                        "href"
                                    );


                                // -----------------------------------------
                                // ONLY PROCESS LINKS WITH HREF
                                // -----------------------------------------

                                if (href) {

                                    try {

                                        // Convert relative URL
                                        // into complete URL

                                        const fullUrl =
                                            new URL(
                                                href,
                                                location.href
                                            ).href;


                                        // Get hostname

                                        const linkHostname =
                                            new URL(
                                                fullUrl
                                            ).hostname;


                                        // Compare hostnames

                                        if (
                                            linkHostname ===
                                            location.hostname
                                        ) {

                                            internalLinks++;

                                        }
                                        else {

                                            externalLinks++;

                                        }


                                        // Store link

                                        linkData.push({

                                            text:
                                                text,

                                            url:
                                                fullUrl

                                        });

                                    }
                                    catch (error) {

                                        // Ignore invalid URLs

                                    }

                                }

                            }
                        );


                        // =================================================
                        // RETURN DATA TO POPUP
                        // =================================================

                        return {

                            title:
                                title,

                            url:
                                currentUrl,
                            
                            hasTitle:
                                hasTitle,

                            h1:
                                h1Count,

                            h2:
                                h2Count,

                            paragraphs:
                                paragraphCount,

                            images:
                                imageCount,

                            links:
                                linkCount,

                            buttons:
                                buttonCount,

                            headings:
                                headingData,

                            linkData:
                                linkData,

                            internalLinks:
                                internalLinks,

                            externalLinks:
                                externalLinks

                        };

                    }

                });


            // ====================================================
            // GET RESULT
            // ====================================================

            const data =
                pageData[0].result;


            // ====================================================
            // SAVE DATA FOR DOWNLOAD
            // ====================================================

            analysisData =
                data;


            // ====================================================
            // CREATE HTML
            // ====================================================

            const headingHTML =
                createHeadingHTML(
                    data.headings
                );


            const linkHTML =
                createLinkHTML(
                    data.linkData
                );


            // ====================================================
            // DISPLAY RESULTS
            // ====================================================

            renderResults(
                data,
                headingHTML,
                linkHTML
            );

        }
        catch (error) {

            console.error(
                "Analysis error:",
                error
            );


            results.innerHTML = `
                
                <p>
                     Error analyzing this page.
                </p>

                <small>
                    ${error.message}
                </small>

            `;

        }

    }
);


// ============================================================
// DOWNLOAD JSON
// ============================================================

downloadButton.addEventListener(
    "click",
    () => {


        // Check whether analysis exists

        if (!analysisData) {

            alert(
                "Please analyze a page first."
            );

            return;
        }


        // Convert JavaScript object
        // into formatted JSON

        const jsonData =
            JSON.stringify(
                analysisData,
                null,
                2
            );


        // Create file-like object

        const blob =
            new Blob(

                [jsonData],

                {
                    type:
                        "application/json"
                }

            );


        // Create temporary URL

        const url =
            URL.createObjectURL(
                blob
            );


        // Create temporary download link

        const a =
            document.createElement(
                "a"
            );


        a.href =
            url;


        a.download =
            "website-analysis.json";


        // Start download

        a.click();


        // Clean up

        URL.revokeObjectURL(
            url
        );

    }
);


// ============================================================
// DOWNLOAD CSV
// ============================================================

downloadCSVButton.addEventListener(
    "click",
    () => {


        // Check whether analysis exists

        if (!analysisData) {

            alert(
                "Please analyze a page first."
            );

            return;
        }


        // ====================================================
        // START CSV
        // ====================================================

        let csv = "";


        csv +=
            "WEBSITE ANALYSIS REPORT\n\n";


        // ====================================================
        // PAGE INFORMATION
        // ====================================================

        csv +=
            "Page Information\n";


        csv +=
            `Title,"${analysisData.title
                .replace(/"/g, '""')}"\n`;


        csv +=
            `URL,"${analysisData.url
                .replace(/"/g, '""')}"\n\n`;


        // ====================================================
        // STATISTICS
        // ====================================================

        csv +=
            "Statistics\n";


        csv +=
            `H1,${analysisData.h1}\n`;


        csv +=
            `H2,${analysisData.h2}\n`;


        csv +=
            `Paragraphs,${analysisData.paragraphs}\n`;


        csv +=
            `Images,${analysisData.images}\n`;


        csv +=
            `Links,${analysisData.links}\n`;


        csv +=
            `Internal Links,${analysisData.internalLinks}\n`;


        csv +=
            `External Links,${analysisData.externalLinks}\n`;


        csv +=
            `Buttons,${analysisData.buttons}\n\n`;


        // ====================================================
        // HEADINGS
        // ====================================================

        csv +=
            "Headings\n";


        csv +=
            "Type,Text\n";


        analysisData.headings.forEach(
            heading => {


                const text =
                    heading.text
                        .replace(/\s+/g, " ")
                        .trim()
                        .replace(/"/g, '""');


                csv +=
                    `"${heading.type}","${text}"\n`;

            }
        );


        csv +=
            "\n";


        // ====================================================
        // LINKS
        // ====================================================

        csv +=
            "Links\n";


        csv +=
            "Text,URL,Type\n";


        analysisData.linkData.forEach(
            link => {


                const text =
                    link.text
                        .replace(/\s+/g, " ")
                        .trim()
                        .replace(/"/g, '""');


                const url =
                    link.url
                        .replace(/"/g, '""');


                let type =
                    "External";


                try {

                    const linkHostname =
                        new URL(
                            link.url
                        ).hostname;


                    const pageHostname =
                        new URL(
                            analysisData.url
                        ).hostname;


                    if (
                        linkHostname ===
                        pageHostname
                    ) {

                        type =
                            "Internal";

                    }

                }
                catch (error) {

                    type =
                        "Other";

                }


                csv +=
                    `"${text}","${url}","${type}"\n`;

            }
        );


        // ====================================================
        // CREATE CSV FILE
        // ====================================================

        const blob =
            new Blob(

                [csv],

                {
                    type:
                        "text/csv;charset=utf-8;"
                }

            );


        // ====================================================
        // CREATE DOWNLOAD URL
        // ====================================================

        const url =
            URL.createObjectURL(
                blob
            );


        // ====================================================
        // CREATE DOWNLOAD LINK
        // ====================================================

        const a =
            document.createElement(
                "a"
            );


        a.href =
            url;


        a.download =
            "website-analysis.csv";


        // Start download

        a.click();


        // Clean up

        URL.revokeObjectURL(
            url
        );

    }
);