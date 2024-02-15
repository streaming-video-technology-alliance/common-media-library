import unittest
from datetime import datetime

from ...structuredfield.parse.parseDict import parseDict
from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.SfException import SfException
from ...structuredfield.SfItem import SfItem
from ...structuredfield.SfToken import SfToken


class TestDecodeSfItem(unittest.TestCase):
    def test_parseDictionary(self):
        self.assertEqual(
            parseDict(
                'int=1, dec=1.23, token=a, str="a", bool=?1, bin=:AQID:, date=@1659578233'
            ),
            ParsedValue(
                {
                    "int": SfItem(1),
                    "dec": SfItem(1.23),
                    "token": SfItem(SfToken("a")),
                    "str": SfItem("a"),
                    "bool": SfItem(True),
                    "bin": SfItem(b"\x01\x02\x03"),
                    "date": SfItem(datetime.fromtimestamp(1659578233)),
                },
                "",
            ),
        )

        self.assertEqual(
            parseDict("a=?0, b, c; foo=bar"),
            ParsedValue(
                {
                    "a": SfItem(False),
                    "b": SfItem(True),
                    "c": SfItem(True, {"foo": SfToken("bar")}),
                },
                "",
            ),
        )

        self.assertEqual(
            parseDict("rating=1.5, feelings=(joy sadness)"),
            ParsedValue(
                {
                    "rating": SfItem(1.5),
                    "feelings": SfItem([SfToken("joy"), SfToken("sadness")]),
                },
                "",
            ),
        )

        self.assertEqual(
            parseDict("a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid"),
            ParsedValue(
                {
                    "a": SfItem([1, 2]),
                    "b": SfItem(3),
                    "c": SfItem(4, {"aa": SfToken("bb")}),
                    "d": SfItem([5, 6], {"valid": True}),
                },
                "",
            ),
        )

        self.assertRaises(SfException, parseDict, "a=1&")
        self.assertRaises(SfException, parseDict, "a=1,")
