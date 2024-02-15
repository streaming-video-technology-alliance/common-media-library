from .parse.parseDict import parseDict
from .parse.parseError import parseError
from .SfException import SfException
from .utils.DICT import DICT


def decodeSfDict(input):
    """
    /**
    * Decode a structured field string into a structured field dictionary
    *
    * @param input - The structured field string to decode
    * @returns The structured field dictionary
    *
    * @group Structured Field
    *
    * @beta
    */
    """
    try:
        dict = parseDict(input.strip())
        if dict.src != "":
            raise parseError(dict.src, DICT)

        return dict.value

    except SfException as cause:
        raise parseError(input, DICT, cause)
