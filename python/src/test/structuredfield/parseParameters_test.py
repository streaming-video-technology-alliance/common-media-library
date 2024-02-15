import unittest

from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.parse.parseParameters import parseParameters
from ...structuredfield.SfException import SfException


class TestParseToken(unittest.TestCase):
    def test_parseString(self):
        self.assertEqual(parseParameters(";a=0"), ParsedValue({"a": 0}, ""))
        self.assertEqual(parseParameters(";a"), ParsedValue({"a": True}, ""))
        self.assertEqual(
            parseParameters(";  a;  b=?0"), ParsedValue({"a": True, "b": False}, "")
        )
        self.assertEqual(
            parseParameters(";a;b=?0;c=10"),
            ParsedValue({"a": True, "b": False, "c": 10}, ""),
        )
