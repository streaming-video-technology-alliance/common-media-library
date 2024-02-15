from datetime import datetime

from ...structuredfield.utils.DATE import DATE
from .ParsedValue import ParsedValue
from .parseError import parseError
from .parseIntegerOrDecimal import parseIntegerOrDecimal


# 4.2.9.  Parsing a Date
#
# Given an ASCII string as input_string, return a Date. input_string is
# modified to remove the parsed value.
#
# 1.  If the first character of input_string is not "@", fail parsing.
#
# 2.  Discard the first character of input_string.
#
# 3.  Let output_date be the result of running Parsing an Integer or
#     Decimal (Section 4.2.4) with input_string.
#
# 4.  If output_date is a Decimal, fail parsing.
#
# 5.  Return output_date.
def parseDate(src):
    i = 0

    if not src or src[i] != "@":
        raise parseError(src, DATE)

    i += 1

    date = parseIntegerOrDecimal(src[i:])

    if not isinstance(i, int):
        raise parseError(src, DATE)

    return ParsedValue(datetime.fromtimestamp(date.value), date.src)
