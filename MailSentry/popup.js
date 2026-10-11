
const analyzeBtn = document.getElementById("analyzeBtn");
const emailHeaders = document.getElementById("emailHeaders");
const results = document.getElementById("results");

analyzeBtn.addEventListener("click", () => {
    const rawHeaders = emailHeaders.value.trim();

    if (!rawHeaders) {
        results.textContent = "Please paste email headers first.";
        return;
    }

    const parsed = parseEmailHeaders(rawHeaders);
    const analysis = analyzeEmailSecurity(parsed);

    // Build the output using textContent to avoid interpreting
    // pasted header content as HTML.
    results.replaceChildren();

    const title = document.createElement("h3");
    title.textContent = "Parsed Email Information";
    results.appendChild(title);

    const fields = [
        ["From", parsed.from],
        ["Reply-To", parsed.replyTo],
        ["Return-Path", parsed.returnPath],
        ["Message-ID", parsed.messageId],
        ["Date", parsed.date],
        ["Subject", parsed.subject],
        ["SPF results", parsed.spf],
        ["DKIM results", parsed.dkim],
        ["DMARC results", parsed.dmarc]
    ];

    for (const [label, values] of fields) {
        const row = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = `${label}: `;
        row.appendChild(strong);
        row.appendChild(
            document.createTextNode(
                values.length ? values.join(", ") : "Not found"
            )
        );

        results.appendChild(row);
    }

    const receivedTitle = document.createElement("h4");
    receivedTitle.textContent = "Mail Delivery Path";
    results.appendChild(receivedTitle);

    if (parsed.received.length) {
        for (const received of parsed.received) {
            const row = document.createElement("p");
            row.textContent = received;
            results.appendChild(row);
        }
    } else {
        const row = document.createElement("p");
        row.textContent = "No Received headers found.";
        results.appendChild(row);
    }
});
