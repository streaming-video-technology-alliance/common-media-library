import unittest

from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.parse.parseString import parseString
from ...structuredfield.SfException import SfException


class TestParseToken(unittest.TestCase):
    def test_parseString(self):
        self.assertEqual(parseString('"asdf"'), ParsedValue("asdf", ""))
        self.assertEqual(parseString('"!#[]"'), ParsedValue("!#[]", ""))
        self.assertEqual(parseString('"a""'), ParsedValue("a", '"'))
        self.assertEqual(parseString('"a\\""'), ParsedValue('a"', ""))
        self.assertEqual(parseString('"a\\\\c"'), ParsedValue("a\\c", ""))

        with self.assertRaises(SfException) as context:
            parseString('"a\\"')
        self.assertEqual(context.exception.message, 'failed to parse ""a\\"" as String')

        with self.assertRaises(SfException) as context:
            parseString('"\\a"')
        self.assertEqual(context.exception.message, 'failed to parse ""\\a"" as String')

        with self.assertRaises(SfException) as context:
            parseString("")
        self.assertEqual(context.exception.message, 'failed to parse "" as String')
