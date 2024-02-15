import re

from ...structuredfield.utils.INTEGER_DECIMAL import INTEGER_DECIMAL
from ...structuredfield.utils.isInvalidInt import isInvalidInt
from .ParsedValue import ParsedValue
from .parseError import parseError


# 4.2.4.  Parsing an Integer or Decimal
#
# Given an ASCII string as input_string, return an Integer or Decimal.
# input_string is modified to remove the parsed value.
#
# NOTE: This algorithm parses both Integers (Section 3.3.1) and
# Decimals (Section 3.3.2), and returns the corresponding structure.
#
# 1.   Let type be "integer".
#
# 2.   Let sign be 1.
#
# 3.   Let input_number be an empty string.
#
# 4.   If the first character of input_string is "-", consume it and
#      set sign to -1.
#
# 5.   If input_string is empty, there is an empty integer; fail
#      parsing.
#
# 6.   If the first character of input_string is not a DIGIT, fail
#      parsing.
#
# 7.   While input_string is not empty:
#
#      1.  Let char be the result of consuming the first character of
#          input_string.
#
#      2.  If char is a DIGIT, append it to input_number.
#
#      3.  Else, if type is "integer" and char is ".":
#
#          1.  If input_number contains more than 12 characters, fail
#              parsing.
#
#          2.  Otherwise, append char to input_number and set type to
#              "decimal".
#
#      4.  Otherwise, prepend char to input_string, and exit the loop.
#
#      5.  If type is "integer" and input_number contains more than 15
#          characters, fail parsing.
#
#      6.  If type is "decimal" and input_number contains more than 16
#          characters, fail parsing.
#
# 8.   If type is "integer":
#
#      1.  Parse input_number as an integer and let output_number be
#          the product of the result and sign.
#
#      2.  If output_number is outside the range -999,999,999,999,999
#          to 999,999,999,999,999 inclusive, fail parsing.
#
# 9.   Otherwise:
#
#      1.  If the final character of input_number is ".", fail parsing.
#
#      2.  If the number of characters after "." in input_number is
#          greater than three, fail parsing.
#
#      3.  Parse input_number as a decimal number and let output_number
#          be the product of the result and sign.
#
# 10.  Return output_number.
def parseIntegerOrDecimal(src):
    orig = src
    sign = 1
    num = ""
    value = None
    i = 0
    error = parseError(orig, INTEGER_DECIMAL)

    if src and src[i] == "-":
        sign = -1
        src = src[1:]

    if len(src) <= 0:
        raise error

    re_integer = r"^(\d+)?"
    result_integer = re.search(re_integer, src)

    if result_integer == None:
        raise error

    integer = result_integer.group()
    num += integer

    src = src[result_integer.span()[1] :]

    if src and src[0] == ".":
        # decimal
        if len(num) > 12:
            raise error

        re_decimal = r"^(\.\d+)?"
        result_decimal = re.search(re_decimal, src)

        if result_decimal == None:
            raise error

        decimal = result_decimal.group()
        src = src[result_decimal.span()[1] :]
        # 9.2.  If the number of characters after "." in input_number is greater than three, fail parsing.
        if len(decimal) == 0 or len(decimal) > 4:
            raise error

        num += decimal

        # 7.6.  If type is "decimal" and input_number contains more than 16 characters, fail parsing.
        if len(num) > 16:
            raise error

        value = float(num) * sign

    else:
        # integer
        # 7.5.  If type is "integer" and input_number contains more than 15 characters, fail parsing.
        if num == "" or len(num) > 15:
            raise error

        value = int(float(num)) * sign

        if isInvalidInt(value):
            raise parseError(num, INTEGER_DECIMAL)

    return ParsedValue(value, src)
