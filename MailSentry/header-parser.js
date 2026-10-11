
function parseEmailHeaders(rawHeaders) {
    const result = {
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

    if (typeof rawHeaders !== "string" || !rawHeaders.trim()) {
        return result;
    }

    // Join folded header lines with their preceding header.
    const unfoldedHeaders = rawHeaders.replace(
        /\r?\n[ \t]+/g,
        " "
    );

    const lines = unfoldedHeaders.split(/\r?\n/);

    for (const line of lines) {
        const separator = line.indexOf(":");

        if (separator <= 0) {
            continue;
        }

        const name = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();

        switch (name) {
            case "from":
                result.from.push(value);
                break;

            case "reply-to":
                result.replyTo.push(value);
                break;

            case "return-path":
                result.returnPath.push(value);
                break;

            case "received":
                result.received.push(value);
                break;

            case "authentication-results":
                result.authenticationResults.push(value);
                break;

            case "message-id":
                result.messageId.push(value);
                break;

            case "date":
                result.date.push(value);
                break;

            case "subject":
                result.subject.push(value);
                break;
        }

        // Extract explicit authentication results.
        if (
            name === "authentication-results" ||
            name === "received-spf"
        ) {
            const spfMatches = value.matchAll(
                /\bspf\s*=\s*(pass|fail|softfail|neutral|none|temperror|permerror)\b/gi
            );

            for (const match of spfMatches) {
                result.spf.push(match[1].toLowerCase());
            }
        }

        if (name === "authentication-results") {
            const dkimMatches = value.matchAll(
                /\bdkim\s*=\s*(pass|fail|softfail|neutral|none|temperror|permerror|policy|permerror)\b/gi
            );

            for (const match of dkimMatches) {
                result.dkim.push(match[1].toLowerCase());
            }

            const dmarcMatches = value.matchAll(
                /\bdmarc\s*=\s*(pass|fail|bestguesspass|none|temperror|permerror)\b/gi
            );

            for (const match of dmarcMatches) {
                result.dmarc.push(match[1].toLowerCase());
            }
        }
    }

    return result;
}
