import unittest

from ...structuredfield.parse.ParsedValue import ParsedValue
from ...structuredfield.parse.parseIntegerOrDecimal import parseIntegerOrDecimal
from ...structuredfield.SfException import SfException


class TestDecodeSfItem(unittest.TestCase):
    def test_parseIntegerOrDecimal(self):
        self.assertEqual(parseIntegerOrDecimal("42"), ParsedValue(42, ""))
        self.assertEqual(parseIntegerOrDecimal("-42"), ParsedValue(-42, ""))
        self.assertEqual(parseIntegerOrDecimal("4.2"), ParsedValue(4.2, ""))
        self.assertEqual(parseIntegerOrDecimal("4a"), ParsedValue(4, "a"))
        self.assertEqual(parseIntegerOrDecimal("4.5"), ParsedValue(4.5, ""))
        self.assertEqual(parseIntegerOrDecimal("-4.5"), ParsedValue(-4.5, ""))
        self.assertEqual(parseIntegerOrDecimal("4.0"), ParsedValue(4, ""))
        self.assertRaises(SfException, parseIntegerOrDecimal, "a")
        self.assertRaises(SfException, parseIntegerOrDecimal, "-")
        self.assertRaises(SfException, parseIntegerOrDecimal, "1.")
        self.assertRaises(SfException, parseIntegerOrDecimal, "")

        # 7.3.1. when decimal and integer length is larger than 12
        self.assertEqual(
            parseIntegerOrDecimal("123456789012.1"), ParsedValue(123456789012.1, "")
        )
        self.assertRaises(SfException, parseIntegerOrDecimal, "1234567890123.1")

        # 7.3.5. If type is "integer" and input_number contains more than 15 characters, fail parsing.
        self.assertEqual(
            parseIntegerOrDecimal("123456789012345"), ParsedValue(123456789012345, "")
        )
        self.assertRaises(SfException, parseIntegerOrDecimal, "1234567890123456")

        # 7.3.6. If type is "decimal" and input_number contains more than 16 characters, fail parsing.
        self.assertEqual(
            parseIntegerOrDecimal("123456789012.456"), ParsedValue(123456789012.456, "")
        )
        self.assertRaises(SfException, parseIntegerOrDecimal, "1234567890123.456")

        # 9.2. If the number of characters after "." in input_number is greater than three, fail parsing.
        self.assertEqual(parseIntegerOrDecimal("0.123"), ParsedValue(0.123, ""))
        self.assertRaises(SfException, parseIntegerOrDecimal, "0.1234")

        # 2. If output_number is outside the range -999,999,999,999,999 to 999,999,999,999,999 inclusive, fail parsing.
        self.assertEqual(
            parseIntegerOrDecimal("-999999999999999"), ParsedValue(-999999999999999, "")
        )
        self.assertRaises(SfException, parseIntegerOrDecimal, "-999999999999999.1")
        self.assertRaises(SfException, parseIntegerOrDecimal, "-1000000000000000")
        self.assertEqual(
            parseIntegerOrDecimal("999999999999999"), ParsedValue(999999999999999, "")
        )
        self.assertRaises(SfException, parseIntegerOrDecimal, "999999999999999.1")
        self.assertRaises(SfException, parseIntegerOrDecimal, "1000000000000000")
