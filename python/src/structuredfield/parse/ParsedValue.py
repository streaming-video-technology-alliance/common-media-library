class ParsedValue:
    def __init__(self, value, src):
        self.value = value
        self.src = src

    def __eq__(self, other):
        if not isinstance(other, ParsedValue):
            return False

        return self.value == other.value and self.src == other.src

    def __str__(self):
        return "ParsedValue(value={}, src={})".format(self.value, self.src)
