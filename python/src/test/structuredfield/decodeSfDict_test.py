import unittest

from ...structuredfield.decodeSfDict import decodeSfDict
from ...structuredfield.SfException import SfException
from ...structuredfield.SfItem import SfItem
from ...structuredfield.SfToken import SfToken


class TestDecodeSfDict(unittest.TestCase):
    def test_blank_string(self):
        self.assertEqual(decodeSfDict(""), {})

    def test_valid_input(self):
        self.assertEqual(
            decodeSfDict("a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid"),
            {
                "a": SfItem([1, 2]),
                "b": SfItem(3),
                "c": SfItem(4, {"aa": SfToken("bb")}),
                "d": SfItem([5, 6], {"valid": True}),
            },
        )

    def test_invalid_input(self):
        with self.assertRaises(SfException) as context:
            decodeSfDict("a=1, b=2)")
        self.assertEqual(
            context.exception.message,
            'failed to parse "a=1, b=2)" as Dict',
        )
        self.assertEqual(
            context.exception.cause.message,
            'failed to parse ")" as Dict',
        )
