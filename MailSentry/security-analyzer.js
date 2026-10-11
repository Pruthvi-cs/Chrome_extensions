
function extractEmailAddress(value) {
    const input = String(value || "").trim();

    // Prefer an address inside angle brackets.
    const bracketMatch = input.match(/<\s*([^<>]+)\s*>/);

    const candidate = bracketMatch
        ? bracketMatch[1].trim()
        : input;

    const match = candidate.match(
        /^[^@\s<>]+@([^@\s<>]+)$/
    );

    if (!match) {
        return null;
    }

    return {
        address: candidate,
        domain: match[1].toLowerCase().replace(/\.$/, "")
    };
}

function getUniqueResults(values) {
    return [...new Set(values)];
}

function analyzeEmailSecurity(parsed) {
    const findings = [];

    const fromAddresses = parsed.from
        .map(extractEmailAddress)
        .filter(Boolean);

    const replyToAddresses = parsed.replyTo
        .map(extractEmailAddress)
        .filter(Boolean);

    const returnPathAddresses = parsed.returnPath
        .map(extractEmailAddress)
        .filter(Boolean);

    // Check the visible sender and Reply-To domains.
    if (fromAddresses.length && replyToAddresses.length) {
        const fromDomains = new Set(
            fromAddresses.map(item => item.domain)
        );

        const replyDomains = new Set(
            replyToAddresses.map(item => item.domain)
        );

        const hasDifferentDomains = [...replyDomains].some(
            domain => !fromDomains.has(domain)
        );

        if (hasDifferentDomains) {
            findings.push({
                severity: "warning",
                title: "Sender and Reply-To domains differ",
                detail:
                    "Replies may go to a different domain than the visible sender. " +
                    "This can be legitimate, but verify the destination before replying."
            });
        }
    }

    // Check the visible sender and Return-Path domains.
    if (fromAddresses.length && returnPathAddresses.length) {
        const fromDomains = new Set(
            fromAddresses.map(item => item.domain)
        );

        const returnDomains = new Set(
            returnPathAddresses.map(item => item.domain)
        );

        const hasDifferentDomains = [...returnDomains].some(
            domain => !fromDomains.has(domain)
        );

        if (hasDifferentDomains) {
            findings.push({
                severity: "info",
                title: "Return-Path domain differs",
                detail:
                    "The bounce address uses a different domain. " +
                    "Mailing services commonly do this, so the difference alone is not evidence of phishing."
            });
        }
    }

    // Interpret explicitly reported authentication outcomes.
    const authenticationChecks = [
        ["SPF", parsed.spf],
        ["DKIM", parsed.dkim],
        ["DMARC", parsed.dmarc]
    ];

    for (const [name, values] of authenticationChecks) {
        const outcomes = getUniqueResults(values);

        if (!outcomes.length) {
            findings.push({
                severity: "info",
                title: `${name} result not found`,
                detail:
                    `No ${name} result was extracted from the supplied headers. ` +
                    "This does not prove that authentication failed."
            });

            continue;
        }

        if (outcomes.includes("fail")) {
            findings.push({
                severity: "warning",
                title: `${name} reported a failure`,
                detail:
                    `The supplied headers report ${name} failure. ` +
                    "The result has not been independently verified."
            });

            continue;
        }

        if (
            outcomes.some(outcome =>
                ["temperror", "permerror", "softfail"].includes(outcome)
            )
        ) {
            findings.push({
                severity: "info",
                title: `${name} has a non-pass result`,
                detail:
                    `The supplied headers contain: ${outcomes.join(", ")}. ` +
                    "This requires context and is not automatically proof of malicious activity."
            });

            continue;
        }

        if (outcomes.every(outcome => outcome === "pass")) {
            findings.push({
                severity: "success",
                title: `${name} reported a pass`,
                detail:
                    `The supplied headers report ${name} passing. ` +
                    "This is a positive signal, not proof that the message is safe."
            });
        } else {
            findings.push({
                severity: "info",
                title: `${name} needs review`,
                detail:
                    `Reported outcomes: ${outcomes.join(", ")}.`
            });
        }
    }

    if (!fromAddresses.length) {
        findings.push({
            severity: "info",
            title: "Sender address unavailable",
            detail:
                "A usable address could not be extracted from the supplied From header."
        });
    }

    return {
        findings,
        summary: findings.length
            ? `Analysis complete: ${findings.length} findings.`
            : "No findings were generated."
    };
}
