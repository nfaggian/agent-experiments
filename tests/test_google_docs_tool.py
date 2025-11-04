import unittest
from unittest.mock import patch, MagicMock

from agents.sow_agent.tools.google_docs_tool import (
    create_document,
    write_markdown_to_document,
    write_to_document,
)


class TestGoogleDocsTool(unittest.TestCase):
    @patch("agents.sow_agent.tools.google_docs_tool._get_credentials")
    @patch("agents.sow_agent.tools.google_docs_tool.build")
    def test_create_document(self, mock_build, mock_get_credentials):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        mock_get_credentials.return_value = MagicMock()

        # Configure the mock to return a value when create is called, and then execute is called
        mock_create = MagicMock()
        mock_service.documents().create.return_value = mock_create
        mock_create.execute.return_value = {
            "documentId": "test_document_id"
        }

        document_id = create_document("Test Document")

        self.assertEqual(document_id, "test_document_id")
        mock_service.documents().create.assert_called_once_with(
            body={"title": "Test Document"}
        )

    @patch("agents.sow_agent.tools.google_docs_tool._get_credentials")
    @patch("agents.sow_agent.tools.google_docs_tool.build")
    def test_write_to_document(self, mock_build, mock_get_credentials):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        mock_get_credentials.return_value = MagicMock()

        # Mock the document.get() call to return a document with content
        mock_get = MagicMock()
        mock_service.documents().get.return_value = mock_get
        mock_get.execute.return_value = {
            "body": {
                "content": [
                    {
                        "endIndex": 10,  # Document has content ending at index 10
                    }
                ]
            }
        }

        write_to_document("test_document_id", "Test content")

        # Verify get() was called to retrieve the document
        mock_service.documents().get.assert_called_once_with(
            documentId="test_document_id"
        )

        # Verify batchUpdate was called with insert at index 9 (end_index - 1)
        mock_service.documents().batchUpdate.assert_called_once_with(
            documentId="test_document_id",
            body={
                "requests": [
                    {
                        "insertText": {
                            "location": {"index": 9},
                            "text": "Test content",
                        }
                    }
                ]
            },
        )

    @patch("agents.sow_agent.tools.google_docs_tool._get_credentials")
    @patch("agents.sow_agent.tools.google_docs_tool.build")
    def test_write_markdown_to_document(self, mock_build, mock_get_credentials):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        mock_get_credentials.return_value = MagicMock()

        # Mock the document.get() call to return an empty document
        mock_get = MagicMock()
        mock_service.documents().get.return_value = mock_get
        mock_get.execute.return_value = {
            "body": {
                "content": []
            }
        }

        markdown_content = """# Heading 1

This is a **bold** paragraph with *italic* text.

- List item 1
- List item 2

1. Ordered item 1
2. Ordered item 2
"""

        write_markdown_to_document("test_document_id", markdown_content)

        # Verify get() was called to retrieve the document
        mock_service.documents().get.assert_called_once_with(
            documentId="test_document_id"
        )

        # Verify batchUpdate was called with markdown conversion requests
        mock_service.documents().batchUpdate.assert_called_once()
        call_args = mock_service.documents().batchUpdate.call_args
        self.assertIn("requests", call_args[1]["body"])
        requests = call_args[1]["body"]["requests"]
        self.assertGreater(len(requests), 0)


if __name__ == "__main__":
    unittest.main()
