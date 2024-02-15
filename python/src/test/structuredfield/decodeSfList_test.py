import unittest

from ...structuredfield.decodeSfList import decodeSfList
from ...structuredfield.SfException import SfException
from ...structuredfield.SfItem import SfItem
from ...structuredfield.SfToken import SfToken


class TestDecodeSfItem(unittest.TestCase):
    def test_empty_string(self):
        self.assertEqual(decodeSfList(""), [])

    def test_valid_input(self):
        self.assertEqual(
            decodeSfList('("foo"; a=1;b=2);lvl=5, ("bar" "baz");lvl=1'),
            [
                SfItem(
                    [
                        SfItem("foo", {"a": 1, "b": 2}),
                    ],
                    {"lvl": 5},
                ),
                SfItem(["bar", "baz"], {"lvl": 1}),
            ],
        )

    def test_invalid_input(self):
        with self.assertRaises(SfException) as context:
            decodeSfList("1,2,3)")
        self.assertEqual(context.exception.message, 'failed to parse "1,2,3)" as List')
        self.assertEqual(context.exception.cause.message, 'failed to parse ")" as List')

        with self.assertRaises(SfException) as context:
            decodeSfList("1,2,")
        self.assertEqual(context.exception.message, 'failed to parse "1,2," as List')
        self.assertEqual(context.exception.cause.message, 'failed to parse "" as List')
