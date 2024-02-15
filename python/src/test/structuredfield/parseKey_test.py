import unittest

from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.parse.parseKey import parseKey
from ...structuredfield.SfException import SfException


class TestDecodeSfItem(unittest.TestCase):
    def test_parseKey(self):
        self.assertEqual(parseKey("a123_-.*"), ParsedValue("a123_-.*", ""))
        self.assertEqual(parseKey("*a123"), ParsedValue("*a123", ""))
        self.assertRaises(SfException, parseKey, "&")
