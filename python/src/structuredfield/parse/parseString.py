import re

from ...structuredfield.utils.STRING import STRING
from ...structuredfield.utils.STRING_REGEX import STRING_REGEX
from .ParsedValue import ParsedValue
from .parseError import parseError


# 4.2.5.  Parsing a String
#
# Given an ASCII string as input_string, return an unquoted String.
# input_string is modified to remove the parsed value.
#
# 1.  Let output_string be an empty string.
#
# 2.  If the first character of input_string is not DQUOTE, fail
#     parsing.
#
# 3.  Discard the first character of input_string.
#
# 4.  While input_string is not empty:
#
#     1.  Let char be the result of consuming the first character of
#         input_string.
#
#     2.  If char is a backslash ("\"):
#
#         1.  If input_string is now empty, fail parsing.
#
#         2.  Let next_char be the result of consuming the first
#             character of input_string.
#
#         3.  If next_char is not DQUOTE or "\", fail parsing.
#
#         4.  Append next_char to output_string.
#
#     3.  Else, if char is DQUOTE, return output_string.
#
#     4.  Else, if char is in the range %x00-1f or %x7f (i.e., is not
#         in VCHAR or SP), fail parsing.
#
#     5.  Else, append char to output_string.
#
# 5.  Reached the end of input_string without finding a closing DQUOTE;
#     fail parsing.
def parseString(src):
    output = ""
    i = 0

    if not src or src[i] != '"':
        raise parseError(src, STRING)

    i += 1

    while len(src) > i:
        if src[i] == "\\":
            if len(src) <= i + 1:
                raise parseError(src, STRING)

            i += 1

            if src[i] != '"' and src[i] != "\\":
                raise parseError(src, STRING)

            output += src[i]

        elif src[i] == '"':
            i += 1
            return ParsedValue(output, src[i:])

        elif re.search(STRING_REGEX, src[i]) != None:
            raise parseError(src, STRING)

        else:
            output += src[i]

        i += 1

    raise parseError(src, STRING)
