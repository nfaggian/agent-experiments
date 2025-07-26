import unittest
from unittest.mock import patch, MagicMock

from ml_agent.tools.google_docs_tool import create_document, write_to_document


class TestGoogleDocsTool(unittest.TestCase):
    @patch("ml_agent.tools.google_docs_tool._get_credentials")
    @patch("ml_agent.tools.google_docs_tool.build")
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

    @patch("ml_agent.tools.google_docs_tool._get_credentials")
    @patch("ml_agent.tools.google_docs_tool.build")
    def test_write_to_document(self, mock_build, mock_get_credentials):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        mock_get_credentials.return_value = MagicMock()

        write_to_document("test_document_id", "Test content")

        mock_service.documents().batchUpdate.assert_called_once_with(
            documentId="test_document_id",
            body={
                "requests": [
                    {
                        "insertText": {
                            "location": {"index": 1},
                            "text": "Test content",
                        }
                    }
                ]
            },
        )


if __name__ == "__main__":
    unittest.main()
