import unittest
from datetime import datetime

from ...structuredfield.parse.parseDate import parseDate
from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.SfException import SfException


class TestDecodeSfItem(unittest.TestCase):
    def test_parseDate(self):
        self.assertEqual(
            parseDate("@1659578233"),
            ParsedValue(datetime.fromtimestamp(1659578233), ""),
        )
        self.assertEqual(
            parseDate("@-1659578233"),
            ParsedValue(datetime.fromtimestamp(-1659578233), ""),
        )
        self.assertRaises(SfException, parseDate, "")
