import unittest

from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.parse.parseToken import parseToken
from ...structuredfield.SfException import SfException
from ...structuredfield.SfToken import SfToken


class TestParseToken(unittest.TestCase):
    def test_parseToken(self):
        token = parseToken("*foo123/456")
        self.assertEqual(token, ParsedValue(SfToken("*foo123/456"), ""))

        token = parseToken("foo123;456")
        self.assertEqual(token, ParsedValue(SfToken("foo123"), ";456"))

        token = parseToken("ABC!#$%&'*+-.^_'|~:/012")
        self.assertEqual(token, ParsedValue(SfToken("ABC!#$%&'*+-.^_'|~:/012"), ""))

        self.assertRaises(SfException, parseToken, "")
