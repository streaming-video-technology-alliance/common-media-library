import unittest
from datetime import datetime

from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.parse.parseList import parseList
from ...structuredfield.SfException import SfException
from ...structuredfield.SfItem import SfItem
from ...structuredfield.SfToken import SfToken


class TestDecodeSfItem(unittest.TestCase):
    def test_parseList(self):
        self.assertEqual(
            parseList('"foo", "bar", "It was the best of times."'),
            ParsedValue(
                [SfItem("foo"), SfItem("bar"), SfItem("It was the best of times.")],
                "",
            ),
        )

        self.assertEqual(
            parseList("foo, bar"),
            ParsedValue(
                [SfItem(SfToken("foo")), SfItem(SfToken("bar"))],
                "",
            ),
        )

        self.assertEqual(
            parseList('1, 1.23, a, "a", ?1, :AQID:, @1659578233'),
            ParsedValue(
                [
                    SfItem(1),
                    SfItem(1.23),
                    SfItem(SfToken("a")),
                    SfItem("a"),
                    SfItem(True),
                    SfItem(b"\x01\x02\x03"),
                    SfItem(datetime.fromtimestamp(1659578233)),
                ],
                "",
            ),
        )

        self.assertEqual(
            parseList('("foo" "bar"), ("baz"), ("bat" "one"), ()'),
            ParsedValue(
                [
                    SfItem([SfItem("foo"), SfItem("bar")]),
                    SfItem([SfItem("baz")]),
                    SfItem([SfItem("bat"), SfItem("one")]),
                    SfItem([]),
                ],
                "",
            ),
        )

        self.assertEqual(
            parseList('("foo"; a=1;b=2);lvl=5, ("bar" "baz");lvl=1'),
            ParsedValue(
                [
                    SfItem([SfItem("foo", {"a": 1, "b": 2})], {"lvl": 5}),
                    SfItem([SfItem("bar"), SfItem("baz")], {"lvl": 1}),
                ],
                "",
            ),
        )

        self.assertRaises(SfException, parseList, '("aaa").')
        self.assertRaises(SfException, parseList, '("aaa"),')
