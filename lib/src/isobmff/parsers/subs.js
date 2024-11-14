// ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
ISOBox.prototype._boxProcessors['subs'] = function () {
	this._procFullBox();
	this._procField('entry_count', 'uint', 4);
	this._procEntries('entries', this.entry_count, function (entry) {
		this._procEntryField(entry, 'sample_delta', 'uint', 4);
		this._procEntryField(entry, 'subsample_count', 'uint', 2);
		this._procSubEntries(entry, 'subsamples', entry.subsample_count, function (subsample) {
			this._procEntryField(subsample, 'subsample_size', 'uint', (this.version === 1) ? 4 : 2);
			this._procEntryField(subsample, 'subsample_priority', 'uint', 1);
			this._procEntryField(subsample, 'discardable', 'uint', 1);
			this._procEntryField(subsample, 'codec_specific_parameters', 'uint', 4);
		});
	});
};
