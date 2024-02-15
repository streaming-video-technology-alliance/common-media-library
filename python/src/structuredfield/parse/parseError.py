from ...structuredfield.utils.throwError import throwError


def parseError(src, type, cause=None):
    return throwError("parse", src, type, cause)
