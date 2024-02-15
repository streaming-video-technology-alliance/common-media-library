from ...structuredfield.SfItem import SfItem
from ...structuredfield.utils.INNER import INNER
from .ParsedValue import ParsedValue
from .parseError import parseError
from .parseItem import parseItem
from .parseParameters import parseParameters


# 4.2.1.2.  Parsing an Inner List
#
# Given an ASCII string as input_string, return the tuple (inner_list,
# parameters), where inner_list is an array of (bare_item, parameters)
# tuples. input_string is modified to remove the parsed value.
#
# 1.  Consume the first character of input_string; if it is not "(",
#     fail parsing.
#
# 2.  Let inner_list be an empty array.
#
# 3.  While input_string is not empty:
#
#     1.  Discard any leading SP characters from input_string.
#
#     2.  If the first character of input_string is ")":
#
#         1.  Consume the first character of input_string.
#
#         2.  Let parameters be the result of running Parsing
#             Parameters (Section 4.2.3.2) with input_string.
#
#         3.  Return the tuple (inner_list, parameters).
#
#     3.  Let item be the result of running Parsing an Item
#         (Section 4.2.3) with input_string.
#
#     4.  Append item to inner_list.
#
#     5.  If the first character of input_string is not SP or ")", fail
#         parsing.
#
# 4.  The end of the inner list was not found; fail parsing.
def parseInnerList(src):
    if src[0] != "(":
        raise parseError(src, INNER)

    src = src[1:]
    innerList = []
    while len(src) > 0:
        src = src.strip()
        if src[0] == ")":
            src = src[1:]
            parsedParameters = parseParameters(src)
            return ParsedValue(
                SfItem(innerList, parsedParameters.value), parsedParameters.src
            )

        parsedItem = parseItem(src)
        innerList.append(parsedItem.value)
        src = parsedItem.src
        if src[0] != " " and src[0] != ")":
            raise parseError(src, INNER)

    raise parseError(src, INNER)
