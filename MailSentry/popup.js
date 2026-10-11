
const analyzeBtn = document.getElementById("analyzeBtn");
const emailHeaders = document.getElementById("emailHeaders");
const results = document.getElementById("results");

// Create a reusable section heading.
function createHeading(text, level = 3) {
    const heading = document.createElement(`h${level}`);
    heading.textContent = text;
    return heading;
}

// Create a label and value row safely.
function createInfoRow(label, value) {
    const row = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = `${label}: `;
    row.appendChild(strong);
    row.appendChild(
        document.createTextNode(
            Array.isArray(value) && value.length
                ? value.join(", ")
                : "Not found"
        )
    );

    return row;
}

// Display the parsed email information.
function renderParsedInformation(parsed) {
    results.appendChild(
        createHeading("Parsed Email Information")
    );

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

    for (const [label, value] of fields) {
        results.appendChild(createInfoRow(label, value));
    }

    results.appendChild(
        createHeading("Mail Delivery Path", 4)
    );

    if (parsed.received.length > 0) {
        for (const received of parsed.received) {
            const row = document.createElement("p");
            row.textContent = received;
            results.appendChild(row);
        }
    } else {
        results.appendChild(
            createInfoRow("Received headers", [])
        );
    }
}

// Display security findings from the analyzer.
function renderSecurityFindings(analysis) {
    results.appendChild(
        createHeading("Security Findings")
    );

    const summary = document.createElement("p");
    summary.textContent = analysis.summary;
    results.appendChild(summary);

    if (!analysis.findings.length) {
        const empty = document.createElement("p");
        empty.textContent = "No findings were generated.";
        results.appendChild(empty);
        return;
    }

    for (const finding of analysis.findings) {
        const card = document.createElement("section");
        const title = document.createElement("h4");
        const detail = document.createElement("p");

        card.className = "finding-card";
        card.dataset.severity = finding.severity;

        title.textContent = finding.title;
        detail.textContent = finding.detail;

        card.append(title, detail);
        results.appendChild(card);
    }
}

// Analyze the supplied email headers.
analyzeBtn.addEventListener("click", () => {
    const rawHeaders = emailHeaders.value.trim();

    // Clear old output before displaying new results.
    results.replaceChildren();

    if (!rawHeaders) {
        results.textContent =
            "Please paste email headers first.";
        return;
    }

    if (
        typeof parseEmailHeaders !== "function" ||
        typeof analyzeEmailSecurity !== "function"
    ) {
        results.textContent =
            "The analysis modules did not load. Check the script tags in popup.html.";
        console.error(
            "Missing parseEmailHeaders or analyzeEmailSecurity."
        );
        return;
    }

    try {
        const parsed = parseEmailHeaders(rawHeaders);
        const analysis = analyzeEmailSecurity(parsed);

        renderParsedInformation(parsed);
        renderSecurityFindings(analysis);

        console.log("MailSentry analysis completed.", {
            parsed,
            analysis
        });
    } catch (error) {
        console.error("MailSentry analysis failed:", error);

        results.textContent =
            "An error occurred while analyzing the headers. Check the popup console for details.";
    }
});
