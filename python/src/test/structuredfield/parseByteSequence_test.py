import unittest

from ...structuredfield.parse.parseByteSequence import parseByteSequence
from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.SfException import SfException


class TestDecodeSfItem(unittest.TestCase):
    def test_parseByteSequence(self):
        self.assertEqual(parseByteSequence(":AQID:"), ParsedValue(b"\x01\x02\x03", ""))
        self.assertRaises(SfException, parseByteSequence, "")
