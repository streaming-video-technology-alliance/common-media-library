from ...structuredfield.SfItem import SfItem
from .parseBareItem import parseBareItem
from .ParsedValue import ParsedValue
from .parseParameters import parseParameters


# 4.2.3.  Parsing an Item
#
# Given an ASCII string as input_string, return a (bare_item,
# parameters) tuple. input_string is modified to remove the parsed
# value.
#
# 1.  Let bare_item be the result of running Parsing a Bare Item
#     (Section 4.2.3.1) with input_string.
#
# 2.  Let parameters be the result of running Parsing Parameters
#     (Section 4.2.3.2) with input_string.
#
# 3.  Return the tuple (bare_item, parameters).
def parseItem(src):
    parsedBareItem = parseBareItem(src)
    src = parsedBareItem.src
    parsedParameters = parseParameters(src)
    src = parsedParameters.src

    return ParsedValue(SfItem(parsedBareItem.value, parsedParameters.value), src)
