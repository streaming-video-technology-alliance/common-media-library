import re

from ...structuredfield.SfToken import SfToken
from ...structuredfield.utils.TOKEN import TOKEN
from .ParsedValue import ParsedValue
from .parseError import parseError

# 4.2.6.  Parsing a Token
#
# Given an ASCII string as input_string, return a Token. input_string
# is modified to remove the parsed value.
#
# 1.  If the first character of input_string is not ALPHA or "*", fail
#     parsing.
#
# 2.  Let output_string be an empty string.
#
# 3.  While input_string is not empty:
#
#     1.  If the first character of input_string is not in tchar, ":"
#         or "/", return output_string.
#
#     2.  Let char be the result of consuming the first character of
#         input_string.
#
#     3.  Append char to output_string.
#
# 4.  Return output_string.


def parseToken(src):
    if not src or re.search("^[a-zA-Z*]$", src[0]) == None:
        raise parseError(src, TOKEN)

    pattern = r"^([!#$%&'*+\-.^_`|~\w:/]+)"
    result = re.search(pattern, src)
    return ParsedValue(SfToken(result.group()), src[result.span()[1] :])
