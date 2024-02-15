import unittest

from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.parse.parseItem import parseItem
from ...structuredfield.SfException import SfException
from ...structuredfield.SfItem import SfItem


class TestDecodeSfItem(unittest.TestCase):
    def test_parseItem(self):
        self.assertEqual(
            parseItem("123;a=1;b"), ParsedValue(SfItem(123, {"a": 1, "b": True}), "")
        )
        self.assertRaises(SfException, parseItem, "")
