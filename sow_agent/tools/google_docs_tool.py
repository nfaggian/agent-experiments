import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/documents"]


def create_document(title: str) -> str:
    """Creates a new Google Doc and returns the document ID."""
    creds = _get_credentials()
    service = build("docs", "v1", credentials=creds)

    document = {"title": title}
    document = service.documents().create(body=document).execute()
    return document.get("documentId")


def write_to_document(document_id: str, content: str) -> None:
    """Writes content to a specified Google Doc."""
    creds = _get_credentials()
    service = build("docs", "v1", credentials=creds)

    requests = [
        {
            "insertText": {
                "location": {"index": 1},
                "text": content,
            }
        }
    ]
    service.documents().batchUpdate(
        documentId=document_id, body={"requests": requests}
    ).execute()


def _get_credentials() -> Credentials:
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
