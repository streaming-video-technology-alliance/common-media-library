class SfItem:
    """
    Structured Field Item

          @group Structured Field

          @beta
    """

    def __init__(self, value, params=None):
        if type(value) == list:
            value = list(map(lambda v: v if type(v) == SfItem else SfItem(v), value))

        self.value = value
        self.params = params

    def __eq__(self, other):
        if not isinstance(other, SfItem):
            return False

        return self.value == other.value and self.params == other.params
