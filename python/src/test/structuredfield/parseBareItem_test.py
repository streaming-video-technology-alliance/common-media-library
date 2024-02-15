import unittest
from datetime import datetime

from ...structuredfield.parse.parseBareItem import parseBareItem
from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.SfException import SfException
from ...structuredfield.SfToken import SfToken


class TestDecodeSfItem(unittest.TestCase):
    def test_parseBareItem(self):
        self.assertEqual(parseBareItem('"string"'), ParsedValue("string", ""))
        self.assertEqual(parseBareItem("123"), ParsedValue(123, ""))
        self.assertEqual(parseBareItem("3.14"), ParsedValue(3.14, ""))
        self.assertEqual(parseBareItem("?1"), ParsedValue(True, ""))
        self.assertEqual(parseBareItem(":AQID:"), ParsedValue(b"\x01\x02\x03", ""))
        self.assertEqual(parseBareItem("token"), ParsedValue(SfToken("token"), ""))
        self.assertEqual(
            parseBareItem("foo123;456"), ParsedValue(SfToken("foo123"), ";456")
        )
        self.assertEqual(
            parseBareItem("@1659578233"),
            ParsedValue(datetime.fromtimestamp(1659578233), ""),
        )
        self.assertRaises(SfException, parseBareItem, "&")
