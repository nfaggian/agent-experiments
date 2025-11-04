"""Google Docs integration tool with Markdown support."""

import os.path
import re
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from markdown_it import MarkdownIt

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/documents"]

# Google Docs heading style mapping
HEADING_STYLE_MAP = {
    1: "HEADING_1",
    2: "HEADING_2",
    3: "HEADING_3",
    4: "HEADING_4",
    5: "HEADING_5",
    6: "HEADING_6",
}


def create_document(title: str) -> str:
    """Creates a new Google Doc and returns the document ID."""
    creds = _get_credentials()
    service = build("docs", "v1", credentials=creds)

    document = {"title": title}
    document = service.documents().create(body=document).execute()
    return document.get("documentId")


def write_markdown_to_document(document_id: str, markdown_content: str) -> None:
    """
    Converts markdown content to formatted Google Doc content.

    Supports:
    - Headings (H1-H6)
    - Paragraphs
    - Ordered and unordered lists
    - Bold and italic text
    - Links
    - Code blocks and inline code
    - Blockquotes
    - Horizontal rules

    Args:
        document_id: The Google Doc document ID
        markdown_content: Markdown formatted content string
    """
    creds = _get_credentials()
    service = build("docs", "v1", credentials=creds)

    # Get the document to find the end index for appending
    doc = service.documents().get(documentId=document_id).execute()
    body = doc.get("body", {})
    content_elements = body.get("content", [])
    if content_elements:
        end_index = content_elements[-1].get("endIndex", 1)
        insert_index = end_index - 1
    else:
        insert_index = 1

    # Parse markdown and convert to Google Docs requests
    requests = _markdown_to_docs_requests(markdown_content, insert_index)

    if requests:
        service.documents().batchUpdate(
            documentId=document_id, body={"requests": requests}
        ).execute()


def write_to_document(document_id: str, content: str) -> None:
    """
    Appends plain text content to a specified Google Doc.

    For markdown support, use write_markdown_to_document instead.
    """
    creds = _get_credentials()
    service = build("docs", "v1", credentials=creds)

    # Get the document to find the end index for appending
    doc = service.documents().get(documentId=document_id).execute()
    body = doc.get("body", {})
    content_elements = body.get("content", [])
    if content_elements:
        end_index = content_elements[-1].get("endIndex", 1)
        insert_index = end_index - 1
    else:
        insert_index = 1

    requests = [
        {
            "insertText": {
                "location": {"index": insert_index},
                "text": content,
            }
        }
    ]
    service.documents().batchUpdate(
        documentId=document_id, body={"requests": requests}
    ).execute()


def _markdown_to_docs_requests(markdown_content: str, start_index: int) -> list[dict[str, Any]]:
    """
    Converts markdown content to Google Docs API batch update requests.

    Args:
        markdown_content: Markdown formatted string
        start_index: Starting index in the document

    Returns:
        List of batch update request dictionaries
    """
    requests: list[dict[str, Any]] = []
    current_index = start_index

    # Parse markdown
    md = MarkdownIt("commonmark")
    tokens = md.parse(markdown_content)

    i = 0
    while i < len(tokens):
        token = tokens[i]

        if token.type == "heading_open":
            level = int(token.tag[1])  # Extract number from h1, h2, etc.
            i += 1
            if i < len(tokens) and tokens[i].type == "inline":
                text = tokens[i].content
                i += 1  # Skip inline
                i += 1  # Skip heading_close

                # Insert heading text
                requests.append(
                    {
                        "insertText": {
                            "location": {"index": current_index},
                            "text": text + "\n",
                        }
                    }
                )

                # Apply heading style
                end_index = current_index + len(text) + 1
                requests.append(
                    {
                        "updateParagraphStyle": {
                            "range": {
                                "startIndex": current_index,
                                "endIndex": end_index,
                            },
                            "paragraphStyle": {
                                "namedStyleType": HEADING_STYLE_MAP.get(level, "HEADING_1")
                            },
                            "fields": "namedStyleType",
                        }
                    }
                )
                current_index = end_index
            continue

        elif token.type == "paragraph_open":
            i += 1
            if i < len(tokens) and tokens[i].type == "inline":
                inline_token = tokens[i]
                para_text, formatting = _parse_inline_content(inline_token)
                i += 1  # Skip inline
                i += 1  # Skip paragraph_close

                # Insert paragraph text
                requests.append(
                    {
                        "insertText": {
                            "location": {"index": current_index},
                            "text": para_text + "\n",
                        }
                    }
                )

                # Apply formatting
                para_end = current_index + len(para_text) + 1
                for fmt in formatting:
                    fmt_start = current_index + fmt["start"]
                    fmt_end = current_index + fmt["end"]
                    fmt_requests = _create_formatting_requests(
                        fmt_start, fmt_end, fmt["type"], fmt.get("url")
                    )
                    requests.extend(fmt_requests)

                current_index = para_end
            else:
                # Empty paragraph
                requests.append(
                    {
                        "insertText": {
                            "location": {"index": current_index},
                            "text": "\n",
                        }
                    }
                )
                current_index += 1
                i += 1  # Skip paragraph_close
            continue

        elif token.type in ("bullet_list_open", "ordered_list_open"):
            is_ordered = token.type == "ordered_list_open"
            i += 1
            list_items = []

            # Collect list items
            while i < len(tokens) and tokens[i].type not in ("bullet_list_close", "ordered_list_close"):
                if tokens[i].type == "list_item_open":
                    i += 1
                    item_text = ""
                    item_formatting = []

                    # Parse list item content
                    while i < len(tokens) and tokens[i].type != "list_item_close":
                        if tokens[i].type == "inline":
                            text, formatting = _parse_inline_content(tokens[i])
                            if item_text:
                                item_text += " "
                            item_text += text
                            item_formatting.extend(formatting)
                            i += 1
                        elif tokens[i].type == "paragraph_open":
                            i += 1
                        elif tokens[i].type == "paragraph_close":
                            i += 1
                        else:
                            i += 1

                    list_items.append((item_text, item_formatting))
                    i += 1  # Skip list_item_close
                else:
                    i += 1

            # Skip list close token
            if i < len(tokens) and tokens[i].type in ("bullet_list_close", "ordered_list_close"):
                i += 1

            # Insert list items
            for item_text, item_formatting in list_items:
                full_text = item_text + "\n"

                requests.append(
                    {
                        "insertText": {
                            "location": {"index": current_index},
                            "text": full_text,
                        }
                    }
                )

                # Apply formatting
                item_end = current_index + len(full_text)
                for fmt in item_formatting:
                    fmt_start = current_index + fmt["start"]
                    fmt_end = current_index + fmt["end"]
                    fmt_requests = _create_formatting_requests(fmt_start, fmt_end, fmt["type"], fmt.get("url"))
                    requests.extend(fmt_requests)

                # Create list paragraph
                requests.append(
                    {
                        "createParagraphBullets": {
                            "range": {
                                "startIndex": current_index,
                                "endIndex": item_end,
                            },
                            "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE" if not is_ordered else "NUMBERED_DECIMAL_ALPHA_ROMAN",
                        }
                    }
                )

                current_index = item_end
            continue

        elif token.type == "blockquote_open":
            i += 1
            quote_text = ""
            quote_formatting = []

            # Collect quote content
            while i < len(tokens) and tokens[i].type != "blockquote_close":
                if tokens[i].type == "paragraph_open":
                    i += 1
                elif tokens[i].type == "paragraph_close":
                    i += 1
                elif tokens[i].type == "inline":
                    text, formatting = _parse_inline_content(tokens[i])
                    quote_text = text
                    quote_formatting = formatting
                    i += 1
                else:
                    i += 1

            # Insert quote text
            full_text = quote_text + "\n"
            requests.append(
                {
                    "insertText": {
                        "location": {"index": current_index},
                        "text": full_text,
                    }
                }
            )

            # Apply quote formatting (indent)
            quote_end = current_index + len(full_text)
            requests.append(
                {
                    "updateParagraphStyle": {
                        "range": {
                            "startIndex": current_index,
                            "endIndex": quote_end,
                        },
                        "paragraphStyle": {
                            "indentFirstLine": {"magnitude": 36, "unit": "PT"},
                            "indentStart": {"magnitude": 36, "unit": "PT"},
                        },
                        "fields": "indentFirstLine,indentStart",
                    }
                }
            )

            # Apply inline formatting
            for fmt in quote_formatting:
                fmt_start = current_index + fmt["start"]
                fmt_end = current_index + fmt["end"]
                fmt_requests = _create_formatting_requests(
                    fmt_start, fmt_end, fmt["type"], fmt.get("url")
                )
                requests.extend(fmt_requests)

            current_index = quote_end
            i += 1  # Skip blockquote_close
            continue

        elif token.type == "code_block_open" or (token.type == "fence" and token.tag == "code"):
            # Code block
            if token.type == "fence":
                code_text = token.content
                i += 1
            else:
                i += 1
                code_text = ""
                while i < len(tokens) and tokens[i].type != "code_block_close":
                    if tokens[i].type == "code_inline":
                        code_text += tokens[i].content + "\n"
                    i += 1
                i += 1  # Skip code_block_close

            # Insert code block
            full_text = code_text + "\n"
            requests.append(
                {
                    "insertText": {
                        "location": {"index": current_index},
                        "text": full_text,
                    }
                }
            )

            # Format as code (monospace)
            code_end = current_index + len(full_text)
            requests.append(
                {
                    "updateTextStyle": {
                        "range": {
                            "startIndex": current_index,
                            "endIndex": code_end - 1,  # Exclude newline
                        },
                        "textStyle": {
                            "weightedFontFamily": {
                                "fontFamily": "Courier New",
                            }
                        },
                        "fields": "weightedFontFamily",
                    }
                }
            )
            current_index = code_end
            continue

        elif token.type == "hr":
            # Horizontal rule - insert a line with formatting
            requests.append(
                {
                    "insertText": {
                        "location": {"index": current_index},
                        "text": "\n",
                    }
                }
            )
            current_index += 1
            i += 1
            continue

        i += 1

    return requests


def _parse_inline_content(inline_token: Any) -> tuple[str, list[dict[str, Any]]]:
    """
    Parse inline token content and extract text with formatting information.

    Returns:
        Tuple of (text, formatting_list) where formatting_list contains
        dicts with 'start', 'end', and 'type' keys
    """
    text = ""
    formatting: list[dict[str, Any]] = []
    current_pos = 0

    def process_token(token: Any) -> None:
        nonlocal text, current_pos

        if token.type == "text":
            text += token.content
            current_pos += len(token.content)
        elif token.type == "strong_open":
            start = current_pos
            # Process children
            for child in token.children or []:
                process_token(child)
            end = current_pos
            formatting.append({"start": start, "end": end, "type": "bold"})
        elif token.type == "em_open":
            start = current_pos
            # Process children
            for child in token.children or []:
                process_token(child)
            end = current_pos
            formatting.append({"start": start, "end": end, "type": "italic"})
        elif token.type == "code_inline":
            start = current_pos
            text += token.content
            end = current_pos + len(token.content)
            current_pos = end
            formatting.append({"start": start, "end": end, "type": "code"})
        elif token.type == "link_open":
            start = current_pos
            href = token.attrGet("href") or ""
            # Process children
            for child in token.children or []:
                process_token(child)
            end = current_pos
            formatting.append({"start": start, "end": end, "type": "link", "url": href})
        else:
            # Process children recursively
            for child in token.children or []:
                process_token(child)

    process_token(inline_token)

    return text, formatting


def _create_formatting_requests(
    start_index: int, end_index: int, format_type: str, url: str | None = None
) -> list[dict[str, Any]]:
    """Create Google Docs formatting requests for text ranges."""
    requests = []

    if format_type == "bold":
        requests.append(
            {
                "updateTextStyle": {
                    "range": {"startIndex": start_index, "endIndex": end_index},
                    "textStyle": {"bold": True},
                    "fields": "bold",
                }
            }
        )
    elif format_type == "italic":
        requests.append(
            {
                "updateTextStyle": {
                    "range": {"startIndex": start_index, "endIndex": end_index},
                    "textStyle": {"italic": True},
                    "fields": "italic",
                }
            }
        )
    elif format_type == "code":
        requests.append(
            {
                "updateTextStyle": {
                    "range": {"startIndex": start_index, "endIndex": end_index},
                    "textStyle": {
                        "weightedFontFamily": {"fontFamily": "Courier New"},
                    },
                    "fields": "weightedFontFamily",
                }
            }
        )
    elif format_type == "link" and url:
        requests.append(
            {
                "updateTextStyle": {
                    "range": {"startIndex": start_index, "endIndex": end_index},
                    "textStyle": {
                        "link": {"url": url},
                    },
                    "fields": "link",
                }
            }
        )

    return requests


def _get_credentials() -> Any:
    """Gets the user's credentials."""
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return creds
