import re

BULLET_PATTERN = re.compile(r"[•▪◦‣–—*→]")

DATE_PATTERN = re.compile(
    r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)"
    r"[a-z]*\.?\s+\d{4}\s*[-–]\s*(Present|\d{4})",
    re.IGNORECASE
)
LOCATION_PATTERN = re.compile(
    r"([A-Za-z .&]+)([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s[A-Z]{2})"
)



def clean_text(raw_text: str) -> str:
    """
    Light-touch resume text cleaning.
    SAFE version: no deletions, no inference.
    """

    text = raw_text
    text = _separate_org_and_location(text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = "\n".join(line.rstrip() for line in text.split("\n"))
    text = BULLET_PATTERN.sub("-", text)
    text = _split_role_and_date(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def _separate_org_and_location(text: str) -> str:
    lines = text.split("\n")
    fixed = []

    for line in lines:
        match = LOCATION_PATTERN.fullmatch(line.strip())
        if match:
            org, location = match.groups()
            fixed.append(f"{org.strip()}, {location.strip()}")
        else:
            fixed.append(line)

    return "\n".join(fixed)


def _split_role_and_date(text: str) -> str:
    lines = text.split("\n")
    fixed = []

    for line in lines:
        match = DATE_PATTERN.search(line)
        if match:
            idx = match.start()
            before = line[:idx].strip()
            after = line[idx:].strip()

            if before and after:
                fixed.append(before)
                fixed.append(after)
            else:
                fixed.append(line)
        else:
            fixed.append(line)

    return "\n".join(fixed)
