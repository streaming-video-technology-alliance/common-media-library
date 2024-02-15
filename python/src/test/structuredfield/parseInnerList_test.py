import unittest
from datetime import datetime

from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.parse.parseInnerList import parseInnerList
from ...structuredfield.SfException import SfException
from ...structuredfield.SfItem import SfItem
from ...structuredfield.SfToken import SfToken


class TestDecodeSfItem(unittest.TestCase):
    def test_parseInnerList(self):
        self.assertEqual(
            parseInnerList("( 1 2 3 )"),
            ParsedValue(SfItem([SfItem(1), SfItem(2), SfItem(3)]), ""),
        )
        self.assertEqual(
            parseInnerList("(1)"),
            ParsedValue(SfItem([SfItem(1)]), ""),
        )
        self.assertEqual(
            parseInnerList("()"),
            ParsedValue(SfItem([]), ""),
        )
        self.assertEqual(
            parseInnerList('(1 1.23 a "a" ?1 :AQID: @1659578233)'),
            ParsedValue(
                SfItem(
                    [
                        SfItem(1),
                        SfItem(1.23),
                        SfItem(SfToken("a")),
                        SfItem("a"),
                        SfItem(True),
                        SfItem(b"\x01\x02\x03"),
                        SfItem(datetime.fromtimestamp(1659578233)),
                    ]
                ),
                "",
            ),
        )

        self.assertRaises(SfException, parseInnerList, "[1 2 3)")
        self.assertRaises(SfException, parseInnerList, "(1 2 3]")
        self.assertRaises(SfException, parseInnerList, "(")
