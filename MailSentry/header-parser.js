function parseEmailHeaders(rawHeaders) {
    const parsed = {
        from: [],
        replyTo: [],
        returnPath: [],
        received: [],
        authenticationResults: [],
        messageId: [],
        date: [],
        subject: [],
        spf: [],
        dkim: [],
        dmarc: []
    };

    if (typeof rawHeaders !== "string") {
        return parsed;
    }

    // Normalize line endings and unfold continuation lines.
    const normalized = rawHeaders
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n[ \t]+/g, " ");

    const lines = normalized.split("\n");

    // Parse one header per line.
    for (const line of lines) {
        const separator = line.indexOf(":");

        if (separator <= 0) {
            continue;
        }

        const name = line
            .slice(0, separator)
            .trim()
            .toLowerCase();

        const value = line
            .slice(separator + 1)
            .trim();

        if (!value) {
            continue;
        }

        switch (name) {
            case "from":
                parsed.from.push(value);
                break;

            case "reply-to":
                parsed.replyTo.push(value);
                break;

            case "return-path":
                parsed.returnPath.push(value);
                break;

            case "received":
                parsed.received.push(value);
                break;

            case "authentication-results":
                parsed.authenticationResults.push(value);
                break;

            case "received-spf":
                parsed.spf.push(value);
                break;

            case "message-id":
                parsed.messageId.push(value);
                break;

            case "date":
                parsed.date.push(value);
                break;

            case "subject":
                parsed.subject.push(value);
                break;
        }
    }

    // Extract authentication outcomes from Authentication-Results.
    const authText = parsed.authenticationResults.join("; ");

    for (const protocol of ["spf", "dkim", "dmarc"]) {
        const expression = new RegExp(
            `(?:^|[;\\s])${protocol}\\s*=\\s*` +
            `(pass|fail|softfail|neutral|none|temperror|permerror)` +
            `(?=\\s|;|$)`,
            "gi"
        );

        for (const match of authText.matchAll(expression)) {
            parsed[protocol].push(
                `${protocol}=${match[1].toLowerCase()}`
            );
        }
    }

    // Remove duplicate values without changing their order.
    for (const key of Object.keys(parsed)) {
        parsed[key] = [...new Set(parsed[key])];
    }

    return parsed;
}
