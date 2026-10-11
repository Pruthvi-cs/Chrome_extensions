```javascript
function extractEmailAddress(value) {
    if (!value) return null;

    const text = String(value);
    const angleAddress = text.match(/<([^<>]+)>/);
    const candidate = angleAddress ? angleAddress[1] : text.trim();
    const emailMatch = candidate.match(
        /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );

    return emailMatch ? emailMatch[0].toLowerCase() : null;
}

function getUniqueResults(values) {
    if (!Array.isArray(values)) return [];

    return [...new Set(
        values
            .filter(value => value != null && String(value).trim())
            .map(value => String(value).trim())
    )];
}

// Normalize an authentication result without treating arbitrary text
// as a confirmed pass or failure.
function getAuthenticationStatus(values, protocol) {
    const statuses = [
        "pass",
        "fail",
        "softfail",
        "neutral",
        "none",
        "temperror",
        "permerror"
    ];

    const reportedValues = getUniqueResults(values);
    const detectedStatuses = [];

    for (const value of reportedValues) {
        const text = value.toLowerCase();

        // Handles values such as "pass" and "spf=pass".
        const directStatus = text.match(
            /^(?:spf|dkim|dmarc)\s*=\s*(pass|fail|softfail|neutral|none|temperror|permerror)$/i
        );

        if (directStatus) {
            detectedStatuses.push(directStatus[1].toLowerCase());
            continue;
        }

        // Handles Authentication-Results fragments such as
        // "mx.example.net; spf=pass; dkim=pass; dmarc=fail".
        const expression = new RegExp(
            `(?:^|[;\\s])${protocol}\\s*=\\s*(pass|fail|softfail|neutral|none|temperror|permerror)(?=\\s|;|$)`,
            "gi"
        );

        for (const match of text.matchAll(expression)) {
            detectedStatuses.push(match[1].toLowerCase());
        }
    }

    const uniqueStatuses = [...new Set(detectedStatuses)];

    return {
        status: uniqueStatuses.length === 1
            ? uniqueStatuses[0]
            : uniqueStatuses.length > 1
                ? "conflicting"
                : "unknown",
        reportedValues,
        detectedStatuses: uniqueStatuses
    };
}

function analyzeEmailSecurity(parsed) {
    const findings = [];

    const fromAddress = extractEmailAddress(
        parsed.from?.[0]
    );

    const replyToAddress = extractEmailAddress(
        parsed.replyTo?.[0]
    );

    const returnPathAddress = extractEmailAddress(
        parsed.returnPath?.[0]
    );

    const fromDomain = fromAddress?.split("@")[1];
    const replyToDomain = replyToAddress?.split("@")[1];
    const returnPathDomain = returnPathAddress?.split("@")[1];

    // Keep findings structured so future assessment logic doesn't
    // need to inspect human-readable titles.
    if (!fromAddress) {
        findings.push({
            code: "sender_unavailable",
            title: "Sender address unavailable",
            detail: "A valid sender email address could not be extracted from the supplied From header.",
            severity: "warning"
        });
    }

    let hasDomainMismatch = false;

    if (
        fromDomain &&
        replyToDomain &&
        fromDomain !== replyToDomain
    ) {
        hasDomainMismatch = true;

        findings.push({
            code: "reply_to_domain_mismatch",
            title: "Sender and Reply-To domains differ",
            detail: "Replies may go to a different domain than the visible sender. This can be legitimate, but verify the destination before replying.",
            severity: "warning"
        });
    }

    if (
        fromDomain &&
        returnPathDomain &&
        fromDomain !== returnPathDomain
    ) {
        findings.push({
            code: "return_path_domain_mismatch",
            title: "Sender and Return-Path domains differ",
            detail: "The envelope return address uses a different domain. This can be legitimate; investigate it alongside other signals.",
            severity: "info"
        });
    }

    const authentication = {
        spf: getAuthenticationStatus(parsed.spf, "spf"),
        dkim: getAuthenticationStatus(parsed.dkim, "dkim"),
        dmarc: getAuthenticationStatus(parsed.dmarc, "dmarc")
    };

    const protocolNames = {
        spf: "SPF",
        dkim: "DKIM",
        dmarc: "DMARC"
    };

    for (const [protocol, result] of Object.entries(authentication)) {
        const name = protocolNames[protocol];

        if (result.status === "unknown") {
            continue;
        }

        if (result.status === "conflicting") {
            findings.push({
                code: `${protocol}_conflicting_results`,
                title: `${name} results conflict`,
                detail: `The supplied headers contain multiple reported ${name} outcomes. The correct result cannot be determined from these values alone.`,
                severity: "warning"
            });

            continue;
        }

        if (result.status === "pass") {
            findings.push({
                code: `${protocol}_pass`,
                title: `${name} reported a pass`,
                detail: `The supplied headers report ${name} passing. This is a positive signal, not proof that the message is safe.`,
                severity: "success"
            });

            continue;
        }

        if (
            result.status === "fail" ||
            result.status === "softfail" ||
            result.status === "permerror"
        ) {
            findings.push({
                code: `${protocol}_failure`,
                title: `${name} reported a failure`,
                detail: `The supplied headers report ${name} as ${result.status}. This warrants investigation, but the result has not been independently verified.`,
                severity: "warning"
            });

            continue;
        }

        if (result.status === "temperror") {
            findings.push({
                code: `${protocol}_temporary_error`,
                title: `${name} temporary error`,
                detail: `The supplied headers report a temporary ${name} evaluation error. This does not by itself establish that the email is malicious.`,
                severity: "info"
            });

            continue;
        }

        findings.push({
            code: `${protocol}_inconclusive`,
            title: `${name} result is inconclusive`,
            detail: `The supplied headers report ${name} as ${result.status}. This outcome alone does not establish whether the email is safe.`,
            severity: "info"
        });
    }

    const hasAuthenticationFailure = Object.values(authentication).some(
        result => [
            "fail",
            "softfail",
            "permerror",
            "conflicting"
        ].includes(result.status)
    );

    const hasAuthenticationPass = Object.values(authentication).some(
        result => result.status === "pass"
    );

    let assessment;
    let assessmentLevel;

    if (hasAuthenticationFailure) {
        assessment = "Authentication concerns detected";
        assessmentLevel = "warning";
    } else if (hasDomainMismatch) {
        assessment = "Review recommended";
        assessmentLevel = "warning";
    } else if (hasAuthenticationPass) {
        assessment = "Some positive authentication signals";
        assessmentLevel = "info";
    } else {
        assessment = "Insufficient evidence";
        assessmentLevel = "info";
    }

    return {
        findings,
        authentication,
        assessment,
        assessmentLevel,
        summary: `Analysis complete: ${findings.length} findings.`
    };
}
```