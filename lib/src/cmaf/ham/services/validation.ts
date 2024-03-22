import {
	Presentation,
	SelectionSet,
	SwitchingSet,
	Track,
} from '../types/model';

type Validation = {
	status: boolean;
	message?: string;
	errors?: string[];
};

function validatePresentation(presentation: Presentation): Validation {
	const validation = {
		status: true,
	};

	return validation;
}

function validateSelectionSet(selectionSet: SelectionSet): Validation {
	const validation = {
		status: true,
	};

	return validation;
}

function validateSwitchingSet(switchingSet: SwitchingSet): Validation {
	const validation = {
		status: true,
	};

	return validation;
}

function validateTrack(tracks: Track): Validation {
	const validation = {
		status: true,
	};

	return validation;
}

function validateSegment(tracks: Track): Validation {
	const validation = {
		status: true,
	};

	return validation;
}
