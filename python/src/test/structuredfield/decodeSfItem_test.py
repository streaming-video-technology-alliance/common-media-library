import unittest
from datetime import datetime

from ...structuredfield.decodeSfItem import decodeSfItem
from ...structuredfield.SfException import SfException
from ...structuredfield.SfItem import SfItem
from ...structuredfield.SfToken import SfToken


class TestDecodeSfItem(unittest.TestCase):
    def test_decodeSfItem(self):
        self.assertEqual(decodeSfItem('"a"'), SfItem("a"))
        self.assertEqual(decodeSfItem("?1"), SfItem(True))
        self.assertEqual(decodeSfItem("1"), SfItem(1))
        self.assertEqual(decodeSfItem("a"), SfItem(SfToken("a")))
        self.assertEqual(decodeSfItem(":AQID:"), SfItem(b"\x01\x02\x03"))
        self.assertEqual(
            decodeSfItem("@1659578233"),
            SfItem(datetime.fromtimestamp(1659578233)),
        )
        self.assertRaises(SfException, decodeSfItem, "1;")

    def test_invalid_input(self):
        with self.assertRaises(SfException) as context:
            decodeSfItem("1;")

        self.assertEqual(
            context.exception.message,
            'failed to parse "1;" as Item',
        )
        self.assertEqual(
            context.exception.cause.message,
            'failed to parse "" as Key',
        )
